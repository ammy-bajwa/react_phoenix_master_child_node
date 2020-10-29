defmodule AlivaWeb.PageController do
  use AlivaWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
