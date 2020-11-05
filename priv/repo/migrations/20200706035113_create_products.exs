defmodule Aliva.Repo.Migrations.CreateProducts do
  use Ecto.Migration

  def change do
    create table(:products) do
      add :firstname, :string
      add :lastname, :string
      add :score, :integer
      add :rank, :integer
      add :percent, :integer

      timestamps()
    end
  end
end
