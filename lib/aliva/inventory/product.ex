defmodule Aliva.Inventory.Product do
  use Ecto.Schema
  import Ecto.Changeset
  @derive {Jason.Encoder, only: [:firstname, :lastname, :score, :rank, :percent]}
  schema "products" do
    field :firstname, :string
    field :lastname, :string
    field :percent, :integer
    field :rank, :integer
    field :score, :integer

    timestamps()
  end

  @doc false
  def changeset(product, attrs) do
    product
    |> cast(attrs, [:firstname, :lastname, :score, :rank, :percent])
    |> validate_required([:firstname, :lastname, :score, :rank, :percent])
  end
end
