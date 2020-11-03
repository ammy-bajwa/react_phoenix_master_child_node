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
    add_node(ip, id, socket);
    {:ok, %{peers: peers}, socket}
  end

  def terminate(_reason, socket) do
    id = Map.get(socket, :id)
    %{ip: ip} = Map.get(socket, :assigns)
    remove_node(ip, id)
    {:ok, %{}, socket}
  end

end
