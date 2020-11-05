defmodule AlivaWeb.ApiAuthPlug do
  @moduledoc false
  use Pow.Plug.Base

  alias Plug.Conn
  alias Pow.{Config, Plug, Store.CredentialsCache}
  alias PowPersistentSession.Store.PersistentSessionCache
  alias AlivaWeb.Endpoint

  @doc """
  Fetches the user from access token.
  """
  @impl true
  @spec fetch(Conn.t(), Config.t()) :: {Conn.t(), map() | nil}
  def fetch(conn, config) do
    with {:ok, signed_token} <- fetch_access_token(conn),
         {user, _metadata} <- get_credentials(conn, signed_token, config) do
      {conn, user}
    else
      _any -> {conn, nil}
    end
  end

  @spec get_credentials(Conn.t(), binary(), Config.t()) :: map() | nil
  def get_credentials(conn, signed_token, config) do
    with {:ok, token} <- verify_token(conn, signed_token, config),
         {user, metadata} <- CredentialsCache.get(store_config(config), token) do
      {user, metadata}
    else
      _any -> nil
    end
  end

  @doc """
  Creates an access and renewal token for the user.

  The tokens are added to the `conn.private` as `:api_access_token` and
  `:api_renewal_token`. The renewal token is stored in the access token
  metadata and vice versa.

  Both tokens will also store a fingerprint in the metadata that's either
  fetched from `conn.private[:pow_api_session_fingerprint]` or randomly
  generated.
  """
  @impl true
  @spec create(Conn.t(), map(), Config.t()) :: {Conn.t(), map()}
  def create(conn, user, config) do
    store_config = store_config(config)
    access_token = Pow.UUID.generate()
    fingerprint = conn.private[:pow_api_session_fingerprint] || Pow.UUID.generate()
    renewal_token = Pow.UUID.generate()

    conn =
      conn
      |> Conn.put_private(:api_access_token, sign_token(conn, access_token, config))
      |> Conn.put_private(:api_renewal_token, sign_token(conn, renewal_token, config))

    CredentialsCache.put(
      store_config,
      access_token,
      {user, fingerprint: fingerprint, renewal_token: renewal_token}
    )

    PersistentSessionCache.put(
      store_config,
      renewal_token,
      {[id: user.id], fingerprint: fingerprint, access_token: access_token}
    )

    {conn, user}
  end

  @doc """
  Delete the access token from the cache.

  The renewal token is deleted by fetching it from the access token metadata.
  """
  @impl true
  @spec delete(Conn.t(), Config.t()) :: Conn.t()
  def delete(conn, config) do
    store_config = store_config(config)

    with {:ok, signed_token} <- fetch_access_token(conn),
         {:ok, token} <- verify_token(conn, signed_token, config),
         {_user, metadata} <- CredentialsCache.get(store_config, token) do
      PersistentSessionCache.delete(store_config, metadata[:renewal_token])
      CredentialsCache.delete(store_config, token)

      Endpoint.broadcast("users_socket:" <> metadata[:fingerprint], "disconnect", %{})
    else
      _any -> :ok
    end

    conn
  end

  @doc """
  Creates new tokens using the renewal token.

  The access token, if any, will be deleted by fetching it from the renewal
  token metadata. The renewal token will be deleted from the store after the
  it has been fetched.

  `:pow_api_session_fingerprint` will be set in `conn.private` with the
  `:fingerprint` fetched from the metadata, to ensure it will be persisted in
  the tokens generated in `create/2`.
  """
  @spec renew(Conn.t(), Config.t()) :: {Conn.t(), map() | nil}
  def renew(conn, config) do
    store_config = store_config(config)

    with {:ok, signed_token} <- fetch_access_token(conn),
         {:ok, token} <- verify_token(conn, signed_token, config),
         {clauses, metadata} <- PersistentSessionCache.get(store_config, token) do
      CredentialsCache.delete(store_config, metadata[:access_token])
      PersistentSessionCache.delete(store_config, token)

      conn
      |> Conn.put_private(:pow_api_session_fingerprint, metadata[:fingerprint])
      |> load_and_create_session({clauses, metadata}, config)
    else
      _any -> {conn, nil}
    end
  end

  defp load_and_create_session(conn, {clauses, _metadata}, config) do
    case Pow.Operations.get_by(clauses, config) do
      nil -> {conn, nil}
      user -> create(conn, user, config)
    end
  end

  defp sign_token(conn, token, config) do
    Plug.sign_token(conn, signing_salt(), token, config)
  end

  defp signing_salt(), do: Atom.to_string(__MODULE__)

  defp fetch_access_token(conn) do
    case Conn.get_req_header(conn, "authorization") do
      [token | _rest] -> {:ok, token}
      _any -> :error
    end
  end

  defp verify_token(conn, token, config),
    do: Plug.verify_token(conn, signing_salt(), token, config)

  defp store_config(config) do
    backend = Config.get(config, :cache_store_backend, Pow.Store.Backend.EtsCache)

    [backend: backend]
  end
end
