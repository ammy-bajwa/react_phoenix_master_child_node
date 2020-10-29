defmodule Aliva.InventoryTest do
  use Aliva.DataCase

  alias Aliva.Inventory

  describe "products" do
    alias Aliva.Inventory.Product

    @valid_attrs %{firstname: "some firstname", lastname: "some lastname", percent: 42, rank: 42, score: 42}
    @update_attrs %{firstname: "some updated firstname", lastname: "some updated lastname", percent: 43, rank: 43, score: 43}
    @invalid_attrs %{firstname: nil, lastname: nil, percent: nil, rank: nil, score: nil}

    def product_fixture(attrs \\ %{}) do
      {:ok, product} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Inventory.create_product()

      product
    end

    test "list_products/0 returns all products" do
      product = product_fixture()
      assert Inventory.list_products() == [product]
    end

    test "get_product!/1 returns the product with given id" do
      product = product_fixture()
      assert Inventory.get_product!(product.id) == product
    end

    test "create_product/1 with valid data creates a product" do
      assert {:ok, %Product{} = product} = Inventory.create_product(@valid_attrs)
      assert product.firstname == "some firstname"
      assert product.lastname == "some lastname"
      assert product.percent == 42
      assert product.rank == 42
      assert product.score == 42
    end

    test "create_product/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Inventory.create_product(@invalid_attrs)
    end

    test "update_product/2 with valid data updates the product" do
      product = product_fixture()
      assert {:ok, %Product{} = product} = Inventory.update_product(product, @update_attrs)
      assert product.firstname == "some updated firstname"
      assert product.lastname == "some updated lastname"
      assert product.percent == 43
      assert product.rank == 43
      assert product.score == 43
    end

    test "update_product/2 with invalid data returns error changeset" do
      product = product_fixture()
      assert {:error, %Ecto.Changeset{}} = Inventory.update_product(product, @invalid_attrs)
      assert product == Inventory.get_product!(product.id)
    end

    test "delete_product/1 deletes the product" do
      product = product_fixture()
      assert {:ok, %Product{}} = Inventory.delete_product(product)
      assert_raise Ecto.NoResultsError, fn -> Inventory.get_product!(product.id) end
    end

    test "change_product/1 returns a product changeset" do
      product = product_fixture()
      assert %Ecto.Changeset{} = Inventory.change_product(product)
    end
  end
end
