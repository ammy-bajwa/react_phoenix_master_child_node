defmodule AlivaWeb.NodeChannel do
  use AlivaWeb, :channel
  import Aliva.Nodes

  def join("web:peer", _, socket) do
    {:ok, %{}, socket}
  end

  def handle_in(
        "web:send_offer_to_child",
        %{
          "offer" => offer
        },
        socket
      ) do
    broadcast(socket, "web:offer_from_master", %{
      offer: offer
    })

    {:noreply, socket}
  end

  def handle_in(
        "web:send_answer_to_master",
        %{
          "answer" => answer
        },
        socket
      ) do
    broadcast(socket, "web:answer_from_child", %{
      answer: answer
    })

    {:noreply, socket}
  end

  def handle_in(
        "web:add_ice_candidate",
        %{"candidate" => candidate},
        socket
      ) do
    broadcast(socket, "web:receive_candidate", %{
      candidate: candidate
    })
    IO.inspect("-----------ICE Event------------")
    {:noreply, socket}
  end

  def terminate(_reason, socket) do
    {:ok, %{}, socket}
  end
end
