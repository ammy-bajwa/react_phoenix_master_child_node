defmodule AlivaWeb.NodeChannel do
  use AlivaWeb, :channel
  import Aliva.Nodes

  defstruct id: ""

  def join("initial:peer", %{"ip" => ip}, socket) do
    IO.inspect("Channel is joined by peer")
    id = Ecto.UUID.generate
    socket = Map.update(socket, :id, nil, fn _value -> id end)
    add_node(ip, id, socket);
    {:ok, %{}, socket}
  end

  def terminate(_reason, socket) do
    id = Map.get(socket, :id)
    IO.inspect("Node disconnect #{id}")
    IO.inspect(socket)
    {:ok, %{}, socket}
  end

end
