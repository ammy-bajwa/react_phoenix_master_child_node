defmodule AlivaWeb.UserChannel do
  import Aliva.Nodes
  use AlivaWeb, :channel

  def join("initial:peer", _message, socket) do
    id = Ecto.UUID.generate
    # addNode(ip, id, socket, type, peers)
    peers = Map.fetch(%Aliva.Nodes{}.my_nodes, "1.1.1.1" )
    addNode("1.1.1.1", id, socket, "MASTER", peers);
    IO.inspect(socket)
  end

end
