defmodule AlivaWeb.NodeChannel do
  use AlivaWeb, :channel
  import Aliva.Nodes

  defstruct id: ""

  def join("web:peer", %{"ip" => ip}, socket) do
    IO.inspect("Channel is joined by peer")
    {:ok, %{}, socket}
  end

  def handle_in("web:boadcast_new_node", %{"ip" => ip, "id" => id, "type" => type}, socket) do
  end

  def terminate(_reason, socket) do
    {:ok, %{}, socket}
  end
end
