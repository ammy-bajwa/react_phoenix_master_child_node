# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
use Mix.Config

config :aliva,
  ecto_repos: [Aliva.Repo]

# Configures the endpoint
config :aliva, AlivaWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "+GmQs+v3wRU7Qb6hgdaQsoawLPiNUBddHm+ZeT5BJQr0E0P3IM07johf3sM2QTE8",
  render_errors: [view: AlivaWeb.ErrorView, accepts: ~w(html json), layout: false],
  pubsub_server: Aliva.PubSub,
  live_view: [signing_salt: "buOH4/R0"]

config :aliva, :pow,
  user: Aliva.Users.User,
  repo: Aliva.Repo

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
