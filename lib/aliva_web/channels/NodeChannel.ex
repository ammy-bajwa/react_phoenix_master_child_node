defmodule AlivaWeb.UserChannel do
  use AlivaWeb, :channel

  def join("initial:peer", message, socket) do
    IO.inspect(socket)
  end

end
