defmodule AlivaWeb.NodeChannel do
  use AlivaWeb, :channel
  import Aliva.Nodes

  def join("web:peer", _, socket) do
    {:ok, %{}, socket}
  end

  def handle_in(
        "web:send_offer",
        %{
          "offer" => offer
        },
        socket
      ) do
    broadcast(socket, "web:receive_offer", %{
      offer: offer
    })

    {:noreply, socket}
  end

  def handle_in(
        "web:send_answer",
        %{
          "answer" => answer
        },
        socket
      ) do
    broadcast(socket, "web:receive_answer", %{
      answer: answer
    })

    {:noreply, socket}
  end

  def handle_in(
        "web:send_ice_to_master",
        %{
          "candidate" => candidate
        },
        socket
      ) do
    broadcast(socket, "web:receive_ice_from_child", %{
      candidate: candidate
    })

    {:noreply, socket}
  end


  def handle_in(
        "web:send_ice_to_child",
        %{
          "candidate" => candidate
        },
        socket
      ) do
    broadcast(socket, "web:receive_ice_from_master", %{
      candidate: candidate
    })

    {:noreply, socket}
  end
  def terminate(_reason, socket) do
    {:ok, %{}, socket}
  end
end
