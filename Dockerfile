FROM elixir:1.9.1-alpine
ARG MIX_ENV=prod
ARG DATABASE_URL=postgres://postgres:postgres@localhost/healthyskin_dev
ARG SECRET_KEY_BASE=secret
ENV MIX_HOME=/root/.mix
WORKDIR /app
COPY . /app
WORKDIR /app/assets
COPY ./assets /app/assets
RUN apk add --update nodejs npm
RUN apk add --update git
RUN npm install -g yarn 
RUN yarn install && yarn run deploy
WORKDIR /app
# COPY --from=assets /app/assets/build /app/assets/build
RUN apk --no-cache add curl
RUN mix local.hex --force && mix local.rebar --force 
ENV PATH "$PATH:/root/.cache/rebar3/bin"
RUN mix deps.get
RUN mix ecto.setup 
CMD mix phx.server