defmodule AlivaWeb.UserChannel do
  import Aliva.Nodes
  import Ecto
  use AlivaWeb, :channel

  def join("initial:peer", message, socket) do
    id = Ecto.UUID.generate
    # addNode(ip, id, socket, type, peers)
    Aget.start
    addNode("1.1.1.1", id, socket, "MASTER", []);
    IO.inspect(socket)
  end

end
