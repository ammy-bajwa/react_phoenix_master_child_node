defmodule AlivaWeb.UserChannel do
  import Aliva.Nodes
  use AlivaWeb, :channel

  def join("initial:peer", _message, socket) do
    id = Ecto.UUID.generate
    # addNode(ip, id, socket, type, peers)
    addNode("1.1.1.1", id, socket, "MASTER", []);
    IO.inspect(socket)
  end

end
