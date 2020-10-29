defmodule Aliva.Users.User do
  use Ecto.Schema
  use Pow.Ecto.Schema
  # @derive {Jason.Encoder()}

  schema "users" do
    pow_user_fields()

    timestamps()
  end
end
