defmodule AlivaWeb.NodeChannel do
  use AlivaWeb, :channel
  import Aliva.Nodes

  def join("initial:peer",_message, socket) do
    IO.inspect("Channel is joined by peer")
    id = Ecto.UUID.generate
    addNode("1.1.1.1", id, "socket", "MASTER");
    # addNode("1.1.1.1", id, socket, "CHILD");
    # addNode("1.1.1.1", id, socket, "CHILD");
    {:ok, %{}, socket}
  end

end
