defmodule Aliva.Nodes do
  defstruct %{}

  def addNode(ip, id, socket, type, peers) do
    myPeerStruct = generatePeerStruct(id, type, socket)
    newList = mergeLists(peers, myPeerStruct)
    ipKey = convertIpToAtom(ip);
    Map.put(%Nodes{}, ipKey,  newList)
  end

  def generatePeerStruct(id, socket, type) do
    %{id: id, type: type, connection: socket}
  end

  def mergeLists(peers, myPeerStruct) do
    Enum.concat(peers,[myPeerStruct] )
  end

  def convertIpToAtom(ip) do
    String.to_atom(ip)
  end
end
