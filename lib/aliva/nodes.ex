defmodule Aliva.Nodes do
  defstruct [my_nodes: %{}]

    # %Main{nodes: %{
  	# "1.1.1.1": [%{connection: "myCon", id: "1", type: "Master"},%{connection: "myCon", id: "2", type: "Child"}],
  	# "2.2.2.2": [%{connection: "myCon", id: "1", type: "Master"},%{connection: "myCon", id: "2", type: "Child"}]
  	# }}

    def addNode(ip, id, socket, type, peers) do
      new_list = generate_peer_struct(id, type, socket)
      |> merge_lists(peers)
      # ip_key = convert_ip_to_atom(ip)
      # updated_map = %{%Main{}.my_nodes | "#{ip}": new_list }
      updated_map = Map.put(%Aliva.Nodes{}.my_nodes, "#{ip}", new_list)
      Map.put(%Aliva.Nodes{}, :my_nodes,  updated_map)
    end

    def generate_peer_struct(id, socket, type) do
      %{id: id, type: type, connection: socket}
    end

    def merge_lists(my_peer_struct, peers) do
      Enum.concat(peers,[my_peer_struct] )
    end

    def convert_ip_to_atom(ip) do
      String.to_atom(ip)
    end
end
