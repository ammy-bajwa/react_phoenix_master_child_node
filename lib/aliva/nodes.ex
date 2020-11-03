defmodule Aliva.Nodes do
  defstruct [my_nodes: %{}]

    # %Main{nodes: %{
  	# "1.1.1.1": [%{connection: "myCon", id: "1", type: "Master"},%{connection: "myCon", id: "2", type: "Child"}],
  	# "2.2.2.2": [%{connection: "myCon", id: "1", type: "Master"},%{connection: "myCon", id: "2", type: "Child"}]
    # }}

    def start_link(initial_state) do
      IO.inspect("Agent Started...........")
      Agent.start_link(fn -> initial_state end, name: __MODULE__)
    end

    def remove_node(ip, id) do
      get_ips_map()
      |> Map.get(ip)
      |> filter_peers_list(id, ip)
    end

    def filter_peers_list(peers_list, id, ip) do
      peers_list
      |> Enum.filter(fn(client_node) ->
        current_node_id = Map.get(client_node, :id, nil)
        current_node_id != id
      end)
      |> make_a_node_master_if_required()
      |> update_ip_map_node_list(ip)
    end

    def make_a_node_master_if_required(peers_list) do
      count = Enum.count(peers_list)
      Agent.start_link(fn -> false end, name: :has_master)
      peers_list
      |> Enum.with_index()
      |> Enum.map(fn ({node, _index}) ->
        node_type = Map.get(node, :type)
        if node_type == "MASTER" do
          Agent.update(:has_master, fn _ -> true end)
        end
        node
      end)

      has_master = Agent.get(:has_master, fn  has_master -> has_master end)

      if has_master == false && count > 0 do
        List.update_at(peers_list, 0, fn node -> Map.put(node, :type, "MASTER")  end)
      else
        peers_list
      end
    end

    def add_node(ip, id, socket) do
      case get_peers(ip) do
        nil -> handle_master_creation(id, socket, ip)
        [] -> handle_master_creation(id, socket, ip)
        peers_list -> handle_child_creation(peers_list, id, socket, ip)
      end
    end

    def handle_child_creation(peers_list, id, socket, ip) do
      generate_peer_struct(id, socket, "CHILD")
      |> add_struct_to_map_child(peers_list, ip)
      |> update_nodes_data()
    end

    def add_struct_to_map_child(struct, peers_list, ip) do
      ips_map = get_ips_map()
      Map.put(ips_map, ip, [struct] ++ peers_list)
    end

    def update_ip_map_node_list(nodes_list, ip ) do
      ips_map = get_ips_map()
      Map.put(ips_map, ip, nodes_list)
      |> update_nodes_data()
    end

    def update_nodes_data(nodes_map) do
      set_tuple_in_agent({:my_nodes, nodes_map})
    end

    def set_tuple_in_agent(my_tuple) do
      Agent.update(__MODULE__, fn _ -> my_tuple end)
      IO.inspect(get_all_node_tuple(), label: "All Nodes -----------------")
    end

    def handle_master_creation(id, socket, ip) do
      generate_peer_struct(id, socket, "MASTER")
      |> add_struct_to_map_master(ip)
      |> update_nodes_data()

    end

    def add_struct_to_map_master(struct, ip) do
      ips_map = get_ips_map()
      Map.put(ips_map, ip, [struct])
    end

    def get_peers(ip) do

      get_ips_map()
      |> get_peers(ip)
    end

    def get_ips_map() do
      {_, ips_map} = get_all_node_tuple()
      ips_map
    end

    def get_peers(ips_map, ip) do
      Map.get(ips_map, ip)
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
    def get_all_node_tuple do
      Agent.get(__MODULE__, fn nodes_list -> nodes_list end)
    end
end
