defmodule AlivaWeb.ApiAuthErrorHandler do
    use AlivaWeb, :controller
    alias Plug.Conn
  
    @spec call(Conn.t(), :not_authenticated) :: Conn.t()
    def call(conn, :not_authenticated) do
      conn
      |> put_status(401)
      |> json(%{error: %{code: 401, message: "Not authenticated"}})
    end
  end