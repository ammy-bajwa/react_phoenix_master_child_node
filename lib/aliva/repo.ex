defmodule Aliva.Repo do
  use Ecto.Repo,
    otp_app: :aliva,
    adapter: Ecto.Adapters.Postgres
end
