defmodule AlivaWeb.UserChannel do
  use AlivaWeb, :channel

  alias Aliva.Inventory
  def join("products:join", _message, socket) do
    # IO.inspect(socket)

   products =  Inventory.list_products()
    {:ok, %{products: products}, socket}
  end

  def handle_in("products:new_msg", %{"body" => body}, socket) do
    case Inventory.create_product(body)  do
{:ok, product} ->
  IO.inspect(product)
  broadcast!(socket, "products:new_msg", %{product: product})
    {:reply, :ok, socket}

  {:error, _reason} ->
    {:reply, :error, socket}
    end


  end

end
