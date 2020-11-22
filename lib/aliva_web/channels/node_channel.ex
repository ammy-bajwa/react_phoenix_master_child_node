defmodule AlivaWeb.NodeChannel do
  use AlivaWeb, :channel
  import Aliva.Nodes

  def join("web:peer", %{"ip" => ip, "machine_id" => machine_id}, socket) do
    socket = assign(socket, :ip, ip)
    is_same = is_from_same_machine(ip, machine_id)
    peers_list = get_all_peers_list(ip)
    peers_count = Enum.count(peers_list)

    if is_same do
      {:ok, %{lan_peers: nil}, socket}
    else
      if peers_count > 0 do
        [master_node | _tail] = get_master_node(ip)
        {:ok, %{lan_peers: [master_node], type: "CHILD"}, socket}
      else
        remote_masters_peers = get_remote_masters_peers(ip)
        nil_check = List.first(remote_masters_peers)

        case nil_check do
          nil ->
            {:ok, %{remote_masters_peers: [], lan_peers: peers_list, type: "MASTER"}, socket}

          _ ->
            {:ok,
             %{remote_masters_peers: remote_masters_peers, lan_peers: peers_list, type: "MASTER"},
             socket}
        end
      end
    end
  end

  def handle_in(
        "web:add_self_to_ip_node_list",
        %{"ip" => ip, "machine_id" => machine_id, "type" => type},
        socket
      ) do
    is_same = is_from_same_machine(ip, machine_id)

    if is_same do
      {:noreply, socket}
    else
      socket = assign(socket, :type, type)

      if type == "MASTER" do
        handle_master_creation(ip, machine_id, type, socket)
        broadcast(socket, "web:new_master_node_added", %{
          ip: ip,
          machine_id: machine_id,
          type: type
        })
      else
        peers_list = get_peers(ip)
        handle_child_creation(peers_list, ip, machine_id, type, socket)
        broadcast(socket, "web:new_#{ip}", %{type: type, machine_id: machine_id, ip: ip})
      end

      socket = Map.update(socket, :id, machine_id, fn _value -> machine_id end)
      {:noreply, socket}
    end
  end

  def handle_in(
        "web:send_offer_to_master",
        %{"ip" => ip, "child_id" => child_id, "offer_for_master" => offer_for_master},
        socket
      ) do
    broadcast(socket, "web:offer_from_child_#{ip}", %{
      offer_for_master: offer_for_master,
      child_id: child_id,
      ip: ip
    })

    {:noreply, socket}
  end

  def handle_in(
        "web:send_offer_to_child",
        %{
          "ip" => ip,
          "child_id" => child_id,
          "master_id" => master_id,
          "offer_for_child" => offer_for_child
        },
        socket
      ) do
    broadcast(socket, "web:offer_from_master_#{child_id}", %{
      offer_from_master: offer_for_child,
      child_id: child_id,
      master_id: master_id,
      ip: ip
    })

    IO.inspect("---------------send_offer_to_child---------------")
    {:noreply, socket}
  end

  def handle_in(
        "web:send_answer_to_master",
        %{
          "answer_for_master" => answer_for_master,
          "child_id" => child_id,
          "master_id" => master_id,
          "ip" => ip
        },
        socket
      ) do
    broadcast(socket, "web:answer_from_child_#{ip}", %{
      answer_for_master: answer_for_master,
      master_id: master_id,
      child_id: child_id
    })

    IO.inspect("---------------send_answer_to_master---------------")
    {:noreply, socket}
  end

  def handle_in(
        "web:send_answer_to_child",
        %{
          "answer_for_child" => answer_for_child,
          "master_id" => master_id,
          "child_id" => child_id
        },
        socket
      ) do
    broadcast(socket, "web:answer_from_master_#{child_id}", %{
      answer_for_child: answer_for_child,
      master_id: master_id,
      child_id: child_id
    })

    {:noreply, socket}
  end

  def handle_in(
        "web:add_ice_candidate_from_child",
        %{"ip" => ip, "child_id" => child_id, "candidate" => candidate},
        socket
      ) do
    broadcast(socket, "web:add_ice_candidate_to_master#{ip}", %{
      child_id: child_id,
      candidate: candidate
    })

    {:noreply, socket}
  end

  def handle_in(
        "web:send_ice_candidate",
        %{"ip" => ip, "child_id" => child_id, "candidate" => candidate},
        socket
      ) do
    broadcast(socket, "web:add_ice_candidate_#{child_id}", %{
      child_id: child_id,
      candidate: candidate,
      ip: ip
    })

    IO.inspect("---------------ICE Candidate---------------")
    {:noreply, socket}
  end

  def handle_in(
        "web:add_ice_candidate_from_master",
        %{"child_id" => child_id, "candidate" => candidate},
        socket
      ) do
    broadcast(socket, "web:add_ice_candidate_to_child#{child_id}", %{
      child_id: child_id,
      candidate: candidate
    })

    {:noreply, socket}
  end

  def terminate(_reason, socket) do
    machine_id_to_remove = Map.get(socket, :id)
    %{ip: ip} = Map.get(socket, :assigns)
    %{type: type} = Map.get(socket, :assigns)
    remove_node(ip, machine_id_to_remove)
    broadcast(socket, "web:remove_#{ip}", %{machine_id: machine_id_to_remove, ip: ip})

    if type == "MASTER" do
      get_master_node(ip)
      |> case do
        [] ->
          broadcast(socket, "web:master_is_removed", %{ip: ip, machine_id: machine_id_to_remove})

        _ ->
          [master_node | _tail] = get_master_node(ip)
          master_node_id = Map.get(master_node, :machine_id)
          peers_list = get_all_peers_list_exclude_master(ip)

          broadcast(socket, "web:update_master_in_child#{ip}", %{
            machine_id: master_node_id,
            ip: ip
          })

          broadcast(socket, "web:make_me_master_#{master_node_id}", %{
            ip: ip,
            lan_peers: peers_list
          })

          broadcast(socket, "web:master_is_removed", %{ip: ip, machine_id: machine_id_to_remove})
          broadcast(socket, "web:add_new_master", %{ip: ip, machine_id: master_node_id})
      end
    end

    {:ok, %{}, socket}
  end
end
