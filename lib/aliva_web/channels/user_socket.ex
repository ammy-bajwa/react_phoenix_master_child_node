defmodule AlivaWeb.UserSocket do
use Phoenix.Socket
alias AlivaWeb.ApiAuthPlug
alias Plug.Conn
  ## Channels
  channel "products:*", AlivaWeb.UserChannel
  # transport(:websocket, Phoenix.Transports.WebSocket, timeout: 45_000)

  # @spec connect(any, any, any) :: none
  # def connect(%{"token" => token}, socket, %{pow_config: config}) do
  # #  %Conn{secret_key_base: socket.endpoint.config(:secret_key_base)}
  # #   |> ApiAuthPlug.get_credentials(token, config)
  # #   |> case do
  # #     nil -> :error
  # #     {user, metadata} ->
  # #       fingerprint = Keyword.fetch!(metadata, :fingerprint)

  # #         socket
  # #         |> assign(:session_fingerprint, fingerprint)
  # #         |> assign(:user_id, user.id)

  #         {:ok, socket}
  #       # end


  # end
  # def id(%{assigns: %{session_fingerprint: session_fingerprint}}), do:  "user_socket:#{session_fingerprint}"


  # def connect(_params, socket, _connect_info) do
  #   {:ok, socket}
  # end

  # Socket id's are topics that allow you to identify all sockets for a given user:
  #
  #     def id(socket), do: "user_socket:#{socket.assigns.user_id}"
  #
  # Would allow you to broadcast a "disconnect" event and terminate
  # all active sockets and channels for a given user:
  #
  #     ReadItLaterWeb.Endpoint.broadcast("user_socket:#{user.id}", "disconnect", %{})
  #
  # Returning `nil` makes this socket anonymous.
  # @impl true
  # def id(_socket), do: nil
  def connect(%{"token" => token} = _params, socket, %{pow_config: config}) do
    %Plug.Conn{secret_key_base: socket.endpoint.config(:secret_key_base)}
    |> ApiAuthPlug.get_credentials(token, config)
    |> case do
      nil -> :error

      {user, metadata} ->
        fingerprint = Keyword.fetch!(metadata, :fingerprint)
        socket      =
          socket
          |> assign(:session_fingerprint, fingerprint)
          |> assign(:user_id, user.id)

        IO.inspect(user, label: "User from backend")

        {:ok, socket}
    end
  end
  # ...

  def id(%{assigns: %{session_fingerprint: session_fingerprint}}), do: "user_socket:#{session_fingerprint}"
end
