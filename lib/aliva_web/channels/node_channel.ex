defmodule AlivaWeb.NodeChannel do
  use AlivaWeb, :channel
  import Aliva.Nodes

  defstruct id: ""

  def join("initial:peer", %{"ip" => ip}, socket) do
    IO.inspect("Channel is joined by peer")
    id = Ecto.UUID.generate
    socket = assign(socket, :ip , ip)
    socket = Map.update(socket, :id, nil, fn _value -> id end)
    peers = get_all_peers_list(ip)
    count = Enum.count(peers)
    add_node(ip, id, socket);
    # Broadcast this node to all peers
    if count > 0 do
      {:ok, %{local_peers: peers, id: id, type: "CHILD"}, socket}
    else
      {:ok, %{local_peers: peers, id: id, type: "MASTER"}, socket}
    end
  end

  def handle_in("initial:boadcast_new_node", %{"ip" => ip, "id" => id}, socket) do
    peers = get_all_peers_list(ip)
    count = Enum.count(peers)
    if count > 1 do
      broadcast(socket, "initial:new_#{ip}", %{type: "CHILD", id: id, ip: ip})
    else
      broadcast(socket, "initial:new_#{ip}", %{type: "MASTER", id: id, ip: ip})
    end
    {:noreply, socket}
  end


  # def handle_in("initial:send_new_offer", %{"offer" => offer, "sender_id" => sender_id}, socket) do
  #   broadcast(socket, "initial:new_offer_#{sender_id}", %{"offer" => offer, "sender_id" => sender_id})
  #   {:noreply, socket}
  # end

  def handle_in("initial:send_new_offer", message, socket) do
    IO.inspect(message, label: "initial:send_new_offer----------------------")
    {:noreply, socket}
  end

  def terminate(_reason, socket) do
    id = Map.get(socket, :id)
    %{ip: ip} = Map.get(socket, :assigns)
    [master_node_beforre | _tail] = get_master_node(ip)
    master_id_before = Map.get(master_node_beforre, :id)
    remove_node(ip, id)
    broadcast(socket, "initial:remove_#{ip}", %{id: id, ip: ip})
    [master_node | _tail] = get_master_node(ip)
    master_id = Map.get(master_node, :id)
    if master_id_before != master_id do
      broadcast(socket, "initial:make_me_master_#{master_id}", %{ip: ip})
      broadcast(socket, "initial:update_master_#{ip}", %{id: master_id, ip: ip})
    end
    {:ok, %{}, socket}
  end

end
