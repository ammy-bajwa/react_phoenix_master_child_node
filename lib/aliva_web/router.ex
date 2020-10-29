defmodule AlivaWeb.Router do
  use AlivaWeb, :router
  use Pow.Phoenix.Router
  use Pow.Extension.Phoenix.Router,
    extensions: [PowResetPassword, PowEmailConfirmation]
  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers

  end
  pipeline :api_protected do
    plug Pow.Plug.RequireAuthenticated, error_handler: AlivaWeb.ApiAuthErrorHandler
  end
  pipeline :api do
    plug :accepts, ["json"]
    # resources "/products", ProductController, except: [:new, :edit]
    plug AlivaWeb.ApiAuthPlug, otp_app: :aliva
  end

  scope "/", AlivaWeb do
    pipe_through :browser

    get "/", PageController, :index
    get "/*path", PageController, :index
  end


  # Other scopes may use custom stacks.
  # scope "/api", AlivaWeb do
  #   pipe_through :api
  # end

  # Enables LiveDashboard only for development
  #
  # If you want to use the LiveDashboard in production, you should put
  # it behind authentication and allow only admins to access it.
  # If your application does not have an admins-only section yet,
  # you can use Plug.BasicAuth to set up some basic authentication
  # as long as you are also using SSL (which you should anyway).
  if Mix.env() in [:dev, :test] do
    # import Phoenix.LiveDashboard.Router

    # scope "/" do
    #   pipe_through :browser
    #   live_dashboard "/dashboard", metrics: AlivaWeb.Telemetry
    # end
  end
end
