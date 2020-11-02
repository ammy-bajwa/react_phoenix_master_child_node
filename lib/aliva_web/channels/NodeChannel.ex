defmodule AlivaWeb.UserChannel do
  import Aliva.Nodes
  use AlivaWeb, :channel

  def join("initial:peer", _message, socket) do
    id = Ecto.UUID.generate
    addNode("1.1.1.1", id, socket, "MASTER");
    addNode("1.1.1.1", id, socket, "CHILD");
    addNode("1.1.1.1", id, socket, "CHILD");
    IO.inspect(socket)
  end

end
