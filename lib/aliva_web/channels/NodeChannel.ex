defmodule AlivaWeb.UserChannel do
  use AlivaWeb, :channel

  def join("initial:join", _message, socket) do
    IO.inspect(socket)
  end

end
