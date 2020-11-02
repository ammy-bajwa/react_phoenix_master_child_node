defmodule Aliva.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application
  import Aliva.Nodes

  def start(_type, _args) do
    children = [
      # Start the Ecto repository
      Aliva.Repo,
      # Start the Telemetry supervisor
      AlivaWeb.Telemetry,
      # Start the PubSub system
      {Phoenix.PubSub, name: Aliva.PubSub},
      # Start the Endpoint (http/https)
      AlivaWeb.Endpoint,
      %{
        id: Aliva.Nodes,
        start: {Aliva.Nodes, :start_link, [my_nodes: %{}]}
      }
      # Start a worker by calling: Aliva.Worker.start_link(arg)
      # {Aliva.Worker, arg}
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Aliva.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  def config_change(changed, _new, removed) do
    AlivaWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
