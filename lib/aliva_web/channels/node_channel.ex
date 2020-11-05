defmodule AlivaWeb.NodeChannel do
  use AlivaWeb, :channel
  import Aliva.Nodes

  def join("web:peer", %{"ip" => ip}, socket) do
    IO.inspect("Channel is joined by peer #{ip}")
    socket = assign(socket, :ip, ip)
    peers_list = get_all_peers_list(ip)
    {:ok, %{lan_peers: peers_list}, socket}
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
      end

      socket = Map.update(socket, :id, machine_id, fn _value -> machine_id end)
      IO.inspect(socket, label: "add_self_to_ip_node_list------------")
      {:noreply, socket}
    end
  end

  def terminate(_reason, socket) do
    # machine_id = Map.get(socket, :id)
    # %{ip: ip} = Map.get(socket, :assigns)
    # %{type: type} = Map.get(socket, :assigns)
    # get_all_peers_list(ip)
    # |> IO.inspect(label: "Terminate===============")
    {:ok, %{}, socket}
  end
end
