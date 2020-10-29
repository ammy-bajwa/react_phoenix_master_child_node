defmodule Aliva.Nodes do
  defstruct %{}

  def addNode(ip, id, socket, type, peers) do
    my_peer_struct = generate_peer_struct(id, type, socket)
    new_list = merge_lists(peers, my_peer_struct)
    ip_key = convert_ip_to_atom(ip);
    Map.put(%Nodes{}, ip_key,  new_list)
g
    %Nodes{}
    |> genrate_ip(ip_key,new_list)
    |>
  end

  def generate_peer_struct(id, socket, type) do
    %{id: id, type: type, connection: socket}
  end

  def merge_lists(peers, my_peer_struct) do
    Enum.concat(peers,[my_peer_struct] )
  end

  def convert_ip_to_atom(ip) do
    String.to_atom(ip)
  end
end
