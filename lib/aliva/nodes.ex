defmodule Aliva.Nodes do
  defstruct [my_nodes: %{}]

    # %Main{nodes: %{
  	# "1.1.1.1": [%{connection: "myCon", id: "1", type: "Master"},%{connection: "myCon", id: "2", type: "Child"}],
  	# "2.2.2.2": [%{connection: "myCon", id: "1", type: "Master"},%{connection: "myCon", id: "2", type: "Child"}]
    # }}

    def start_link(initial_state) do
      Agent.start_link(fn -> initial_state end, name: __MODULE__)
    end

    def addNode(ip, id, socket, type) do
      peers = get_peers(ip)
      new_list = generate_peer_struct(id, type, socket)
      |> merge_lists(peers)
      updated_map = Map.put(%Aliva.Nodes{}.my_nodes, "#{ip}", new_list)
      Agent.update(__MODULE__, fn _ -> updated_map end)
    end

    def get_peers(ip) do
      get_all_node_list()
      |> get_peers(ip)
    end

    def get_peers(nodes_list, ip) do
      nodes_list.my_nodes["#{ip}"]
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
    def get_all_node_list do
      Agent.get(__MODULE__, fn nodes_list -> nodes_list end)
    end
end
