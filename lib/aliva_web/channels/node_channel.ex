defmodule AlivaWeb.NodeChannel do
  use AlivaWeb, :channel
  import Aliva.Nodes

  def join("web:peer", %{"ip" => ip, "machine_id" => machine_id}, socket) do
    IO.inspect("Channel is joined by peer #{ip}")
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
        {:ok, %{lan_peers: peers_list, type: "MASTER"}, socket}
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
      else
        peers_list = get_peers(ip)
        handle_child_creation(peers_list, ip, machine_id, type, socket)
        broadcast(socket, "web:new_#{ip}", %{type: type, machine_id: machine_id, ip: ip})
      end
      socket = Map.update(socket, :id, machine_id, fn _value -> machine_id end)
      IO.inspect(socket, label: "add_self_to_ip_node_list------------")
      {:noreply, socket}
    end
  end

  def terminate(_reason, socket) do
    machine_id_to_remove = Map.get(socket, :id)
    %{ip: ip} = Map.get(socket, :assigns)
    %{type: type} = Map.get(socket, :assigns)
    remove_node(ip, machine_id_to_remove)
    broadcast(socket, "web:remove_#{ip}", %{machine_id: machine_id_to_remove, ip: ip})
    [master_node | _tail] = get_master_node(ip)
    master_node_id = Map.get(master_node, :machine_id)
    if type == "MASTER" do
      peers_list = get_all_peers_list_exclude_master(ip)
      broadcast(socket, "web:update_master_in_child#{ip}", %{machine_id: master_node_id, ip: ip})
      broadcast(socket, "web:make_me_master_#{master_node_id}", %{ip: ip, lan_peers: peers_list})
    end
    {:ok, %{}, socket}
  end
end
