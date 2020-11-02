defmodule AlivaWeb.NodeChannel do
  use AlivaWeb, :channel
  import Aliva.Nodes

  defstruct id: ""

  def join("initial:peer",message, socket) do
    IO.inspect("Channel is joined by peer")
    id = Ecto.UUID.generate
    socket = Map.update(socket, :id, nil, fn _existing_value -> id end)
    IO.inspect(message, label: "Message----------------")
    add_node("1.1.1.1", id, socket);
    add_node("2.2.2.2", id, socket);
    {:ok, %{}, socket}
  end

  def terminate(_reason, socket) do
    id = Map.get(socket, :id)
    IO.inspect("Node disconnect #{id}")
    IO.inspect(socket)
    {:ok, %{}, socket}
  end

end
