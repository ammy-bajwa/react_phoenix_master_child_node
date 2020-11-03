defmodule AlivaWeb.NodeChannel do
  use AlivaWeb, :channel
  import Aliva.Nodes

  defstruct id: ""

  def join("initial:peer", %{"ip" => ip}, socket) do
    IO.inspect("Channel is joined by peer")
    id = Ecto.UUID.generate
    socket = assign(socket, :ip , ip)
    socket = Map.update(socket, :id, nil, fn _value -> id end)
    peers = get_all_peers_list(ip)
    count = Enum.count(peers)
    add_node(ip, id, socket);
    # Broadcast this node to all peers
    if count > 0 do
      {:ok, %{local_peers: peers, id: id, type: "CHILD"}, socket}
    else
      {:ok, %{local_peers: peers, id: id, type: "MASTER"}, socket}
    end
  end

  def handle_in("initial:boadcast_new_node", %{"ip" => ip, "id" => id}, socket) do
    peers = get_all_peers_list(ip)
    count = Enum.count(peers)
    if count > 1 do
      broadcast(socket, "initial:new_#{ip}", %{type: "CHILD", id: id, ip: ip})
    else
      broadcast(socket, "initial:new_#{ip}", %{type: "MASTER", id: id, ip: ip})
    end
    {:noreply, socket}
  end

  def terminate(_reason, socket) do
    id = Map.get(socket, :id)
    %{ip: ip} = Map.get(socket, :assigns)
    remove_node(ip, id)
    {:ok, %{}, socket}
  end

end
