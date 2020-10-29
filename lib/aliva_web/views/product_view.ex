defmodule AlivaWeb.ProductView do
  use AlivaWeb, :view
  alias AlivaWeb.ProductView

  def render("index.json", %{products: products}) do
    %{data: render_many(products, ProductView, "product.json")}
  end

  def render("show.json", %{product: product}) do
    %{data: render_one(product, ProductView, "product.json")}
  end

  def render("product.json", %{product: product}) do
    %{id: product.id,
      firstname: product.firstname,
      lastname: product.lastname,
      score: product.score,
      rank: product.rank,
      percent: product.percent}
  end
end
