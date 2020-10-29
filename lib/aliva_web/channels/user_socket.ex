defmodule AlivaWeb.UserSocket do
use Phoenix.Socket
alias AlivaWeb.ApiAuthPlug
alias Plug.Conn
  ## Channels
  channel "initial:*", AlivaWeb.NodeChannel
  def connect(_params, socket, _connect_info) do
      {:ok, socket}
    end

    def id(_socket), do: nil
  end
