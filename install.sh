#!/bin/sh
# LinkedGrow self hosted installer.
#
#   curl -fsSL https://raw.githubusercontent.com/DigiHold/LinkedGrow/main/install.sh | sh
#   ./install.sh --domain linkedgrow.example.com
#   ./install.sh update
#
# It installs Docker when it is missing, writes .env with fresh secrets, pulls the
# published images and starts the stack. Run it again any time; it keeps the .env
# it already wrote.
set -eu

REPO="DigiHold/LinkedGrow"
DEFAULT_DIR="/opt/linkedgrow"

MODE="install"
DIR="${LINKEDGROW_DIR:-$DEFAULT_DIR}"
DOMAIN="${LINKEDGROW_DOMAIN:-}"
DOMAIN_GIVEN=0
VERSION="${LINKEDGROW_VERSION:-latest}"
VERSION_GIVEN=0
PORT="${LINKEDGROW_PORT:-3000}"
PORT_GIVEN=0
SOURCE=0
ASSUME_YES=0
SUDO=""
DOCKER="docker"
PROFILE_ARGS=""
[ -z "${LINKEDGROW_VERSION:-}" ] || VERSION_GIVEN=1
[ -z "${LINKEDGROW_PORT:-}" ] || PORT_GIVEN=1

say() { printf '%s\n' "$1"; }
fail() { printf 'linkedgrow: %s\n' "$1" >&2; exit 1; }

usage() {
  cat <<'USAGE'
LinkedGrow self hosted installer.

Usage:
  install.sh [options]
  install.sh update [options]

Options:
  --domain NAME    Serve on this domain over https, with the built in Caddy.
  --no-domain      Serve on the server address over http, on the port below.
  --dir PATH       Where the stack lives. Default /opt/linkedgrow
  --version TAG    Image tag to run: latest, v1.0.0, sha-1a2b3c4. Default latest
  --port NUMBER    Port the app is published on. Default 3000
  --source         Build the images from the source instead of pulling them.
  --yes            Never ask anything. Needs --domain or --no-domain.
  --help           Print this and stop.

Environment: LINKEDGROW_DIR, LINKEDGROW_DOMAIN, LINKEDGROW_VERSION, LINKEDGROW_PORT.
USAGE
}

# ---------- arguments ----------

if [ "$#" -gt 0 ] && [ "$1" = "update" ]; then
  MODE="update"
  shift
fi

while [ "$#" -gt 0 ]; do
  case "$1" in
    --domain) [ "$#" -ge 2 ] || fail "The --domain option needs a domain name."; DOMAIN="$2"; DOMAIN_GIVEN=1; shift 2 ;;
    --domain=*) DOMAIN="${1#--domain=}"; DOMAIN_GIVEN=1; shift ;;
    --no-domain) DOMAIN=""; DOMAIN_GIVEN=1; shift ;;
    --dir) [ "$#" -ge 2 ] || fail "The --dir option needs a folder path."; DIR="$2"; shift 2 ;;
    --dir=*) DIR="${1#--dir=}"; shift ;;
    --version) [ "$#" -ge 2 ] || fail "The --version option needs an image tag."; VERSION="$2"; VERSION_GIVEN=1; shift 2 ;;
    --version=*) VERSION="${1#--version=}"; VERSION_GIVEN=1; shift ;;
    --port) [ "$#" -ge 2 ] || fail "The --port option needs a port number."; PORT="$2"; PORT_GIVEN=1; shift 2 ;;
    --port=*) PORT="${1#--port=}"; PORT_GIVEN=1; shift ;;
    --source) SOURCE=1; shift ;;
    --yes|-y) ASSUME_YES=1; shift ;;
    --help|-h) usage; exit 0 ;;
    *) fail "There is no option called $1. Run install.sh --help for the list." ;;
  esac
done

case "$PORT" in
  ''|*[!0-9]*) fail "The port must be a number, and $PORT is not." ;;
esac

# ---------- where this script sits ----------

SELF_DIR=""
case "${0:-}" in
  sh|-sh|bash|-bash|dash|-|"") : ;;
  *) if [ -f "$0" ]; then SELF_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd); fi ;;
esac

CHECKOUT=""
if [ -n "$SELF_DIR" ] && [ -f "$SELF_DIR/docker-compose.yml" ] && [ -f "$SELF_DIR/docker/Dockerfile.app" ]; then
  CHECKOUT="$SELF_DIR"
fi

# A source build from a checkout runs in that checkout, where the Dockerfiles are.
if [ "$SOURCE" = "1" ] && [ -n "$CHECKOUT" ]; then
  DIR="$CHECKOUT"
fi

# An update run started from the stack folder stays in it.
if [ "$MODE" = "update" ] && [ -z "${LINKEDGROW_DIR:-}" ] && [ -n "$SELF_DIR" ] && [ -f "$SELF_DIR/.env" ] && [ -f "$SELF_DIR/docker-compose.yml" ]; then
  DIR="$SELF_DIR"
fi

ENV_FILE="$DIR/.env"

env_get() {
  [ -f "$ENV_FILE" ] || return 0
  sed -n "s/^$1=//p" "$ENV_FILE" | head -1
}

env_set() {
  if [ -f "$ENV_FILE" ] && grep -q "^$1=" "$ENV_FILE"; then
    awk -v k="$1" -v v="$2" 'index($0, k "=") == 1 { print k "=" v; next } { print }' "$ENV_FILE" > "$ENV_FILE.tmp"
    mv "$ENV_FILE.tmp" "$ENV_FILE"
  else
    printf '%s=%s\n' "$1" "$2" >> "$ENV_FILE"
  fi
}

# An option wins over .env, and .env wins over the default, so a rerun without
# options keeps the port and the pinned version this instance already runs.
if [ "$PORT_GIVEN" = "0" ]; then
  previous_port=$(env_get APP_PORT)
  case "$previous_port" in
    ''|*[!0-9]*) : ;;
    *) PORT="$previous_port" ;;
  esac
fi
if [ "$VERSION_GIVEN" = "0" ]; then
  previous_version=$(env_get LINKEDGROW_VERSION)
  if [ -n "$previous_version" ]; then
    VERSION="$previous_version"
  fi
fi

REF="main"
case "$VERSION" in
  latest|"") VERSION="latest" ;;
  *) REF="$VERSION" ;;
esac
RAW="https://raw.githubusercontent.com/$REPO/$REF"

# ---------- privileges ----------

if [ "$(id -u)" != "0" ]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    fail "Run this as root, or install sudo first."
  fi
fi

run_root() {
  if [ -n "$SUDO" ]; then $SUDO "$@"; else "$@"; fi
}

# ---------- docker ----------

install_docker() {
  os=$(uname -s)
  if [ "$os" != "Linux" ]; then
    fail "Docker is not installed. Install Docker Desktop or Docker Engine on this machine, then run this again."
  fi
  if ! command -v apt-get >/dev/null 2>&1 && ! command -v dnf >/dev/null 2>&1; then
    fail "Docker is not installed and this distribution is not apt or dnf based. Install Docker Engine yourself, then run this again."
  fi
  say "Installing Docker with the official script from get.docker.com."
  tmp="${TMPDIR:-/tmp}/linkedgrow-get-docker.sh"
  curl -fsSL https://get.docker.com -o "$tmp" || fail "Could not download the Docker install script from get.docker.com."
  run_root sh "$tmp" || fail "The Docker install script failed. Install Docker yourself, then run this again."
  rm -f "$tmp"
}

command -v curl >/dev/null 2>&1 || fail "This installer needs curl and curl is missing. Install it, then run this again."
command -v docker >/dev/null 2>&1 || install_docker

if ! docker info >/dev/null 2>&1; then
  if [ -n "$SUDO" ] && $SUDO docker info >/dev/null 2>&1; then
    DOCKER="$SUDO docker"
  else
    fail "Docker is installed but the daemon does not answer. Start Docker, then run this again."
  fi
fi

$DOCKER compose version >/dev/null 2>&1 || fail "Docker runs without the Compose plugin. Install docker-compose-plugin, then run this again."

# ---------- the stack folder ----------

if [ ! -d "$DIR" ]; then
  mkdir -p "$DIR" 2>/dev/null || run_root mkdir -p "$DIR" || fail "Could not create the folder $DIR."
  if [ ! -w "$DIR" ]; then
    run_root chown "$(id -u):$(id -g)" "$DIR" || true
  fi
fi
[ -w "$DIR" ] || fail "$DIR is not writable by this user."

fetch() {
  # fetch <source path in the repo> <destination>
  if [ -n "$CHECKOUT" ]; then
    cp "$CHECKOUT/$1" "$2" || fail "Could not copy $1 from $CHECKOUT."
  else
    curl -fsSL "$RAW/$1" -o "$2" || fail "Could not download $1 from $RAW. Check the version tag and the network."
  fi
}

if [ "$SOURCE" = "1" ] && [ -z "$CHECKOUT" ]; then
  command -v git >/dev/null 2>&1 || fail "--source needs git and git is missing. Install git, then run this again."
  if [ -d "$DIR/.git" ]; then
    say "Updating the checkout in $DIR."
    (cd "$DIR" && git fetch --depth 1 origin "$REF" && git checkout -q FETCH_HEAD) || fail "Could not update the checkout in $DIR."
  else
    say "Cloning the source into $DIR."
    git clone --depth 1 --branch "$REF" "https://github.com/$REPO.git" "$DIR" || fail "Could not clone $REPO over https. The repository is private until launch, so sign in with a token or install without --source."
  fi
  CHECKOUT="$DIR"
fi

if [ "$MODE" = "install" ] && [ "$DIR" != "$CHECKOUT" ]; then
  fetch docker-compose.yml "$DIR/docker-compose.yml"
  fetch docker/Caddyfile "$DIR/Caddyfile"
  fetch install.sh "$DIR/install.sh.new"
  mv "$DIR/install.sh.new" "$DIR/install.sh"
  chmod +x "$DIR/install.sh"
  if [ "$SOURCE" = "1" ]; then
    fetch docker-compose.build.yml "$DIR/docker-compose.build.yml"
  fi
fi

COMPOSE_FILES="-f $DIR/docker-compose.yml"
if [ "$SOURCE" = "1" ]; then
  COMPOSE_FILES="$COMPOSE_FILES -f $DIR/docker-compose.build.yml"
fi

compose() {
  # shellcheck disable=SC2086
  $DOCKER compose --project-directory "$DIR" $COMPOSE_FILES --env-file "$ENV_FILE" $PROFILE_ARGS "$@"
}

# ---------- update ----------

if [ "$MODE" = "update" ]; then
  [ -f "$ENV_FILE" ] || fail "There is no .env file in $DIR. Run the installer without the update argument first."
  [ -f "$DIR/docker-compose.yml" ] || fail "There is no docker-compose.yml in $DIR. Run the installer without the update argument first."
  if [ "$(env_get COMPOSE_PROFILES)" = "https" ]; then
    PROFILE_ARGS="--profile https"
  fi
  say "Updating the stack that lives in $DIR."
  if [ "$SOURCE" = "1" ]; then
    compose pull --ignore-pull-failures || true
    compose up -d --build || fail "The stack did not start. Run 'docker compose logs' in $DIR to see why."
  else
    if [ "${LINKEDGROW_SKIP_PULL:-0}" != "1" ]; then
      compose pull || fail "Could not pull the images. Sign in with 'docker login ghcr.io', or run the installer with --source."
    fi
    compose up -d || fail "The stack did not start. Run 'docker compose logs' in $DIR to see why."
  fi
  say "The app applies any new migration while it starts."
  exit 0
fi

# ---------- the domain question ----------

if [ "$DOMAIN_GIVEN" = "0" ] && [ -f "$ENV_FILE" ]; then
  previous=$(env_get DOMAIN)
  if [ -n "$previous" ]; then
    DOMAIN="$previous"
    DOMAIN_GIVEN=1
  elif [ -n "$(env_get APP_URL)" ]; then
    DOMAIN=""
    DOMAIN_GIVEN=1
  fi
fi

if [ "$DOMAIN_GIVEN" = "0" ]; then
  if [ "$ASSUME_YES" = "1" ]; then
    fail "There is nothing to serve on yet. Add --domain example.com, or --no-domain to serve on the server address."
  fi
  if [ -r /dev/tty ]; then
    printf 'Domain for this instance, empty to serve on the server address over http: '
    read -r answer < /dev/tty || answer=""
    DOMAIN=$(printf '%s' "$answer" | tr -d '[:space:]')
  else
    fail "There is no terminal here to ask the domain question. Add --domain example.com or --no-domain."
  fi
fi

case "$DOMAIN" in
  http://*|https://*) DOMAIN=$(printf '%s' "$DOMAIN" | sed -e 's#^https\{0,1\}://##' -e 's#/.*$##') ;;
esac

# ---------- the machine ----------

gen_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    od -An -vN 32 -tx1 /dev/urandom | tr -d ' \n'
  fi
}

public_ip() {
  ip=$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || true)
  case "$ip" in
    ''|*[!0-9.]*) ip="" ;;
  esac
  if [ -z "$ip" ] && command -v hostname >/dev/null 2>&1; then
    ip=$(hostname -I 2>/dev/null | awk '{print $1}')
  fi
  [ -n "$ip" ] || ip="127.0.0.1"
  printf '%s' "$ip"
}

resolved_ip() {
  if command -v getent >/dev/null 2>&1; then
    getent ahostsv4 "$1" 2>/dev/null | awk 'NR==1 {print $1}'
  elif command -v dig >/dev/null 2>&1; then
    dig +short A "$1" 2>/dev/null | awk 'NR==1 {print}'
  elif command -v host >/dev/null 2>&1; then
    host -t A "$1" 2>/dev/null | awk '/has address/ {print $4; exit}'
  fi
}

worker_slots() {
  mb=0
  if [ -r /proc/meminfo ]; then
    mb=$(awk '/^MemTotal:/ {print int($2 / 1024); exit}' /proc/meminfo)
  elif command -v sysctl >/dev/null 2>&1; then
    mb=$(sysctl -n hw.memsize 2>/dev/null | awk '{print int($1 / 1048576)}')
  fi
  case "$mb" in
    ''|*[!0-9]*) mb=0 ;;
  esac
  if [ "$mb" -ge 16384 ]; then
    printf '8'
  elif [ "$mb" -ge 8192 ]; then
    printf '4'
  else
    printf '2'
  fi
}

IP=$(public_ip)

if [ -n "$DOMAIN" ]; then
  APP_URL="https://$DOMAIN"
  BIND="127.0.0.1"
  PROFILES="https"
else
  APP_URL="http://$IP:$PORT"
  BIND="0.0.0.0"
  PROFILES=""
fi

# ---------- .env ----------

if [ -f "$ENV_FILE" ]; then
  say "Keeping the .env already in $DIR."
else
  (
  umask 077
  cat > "$ENV_FILE" <<ENVFILE
# Written by install.sh. Keep this file: every stored credential is encrypted
# with ENCRYPTION_KEY and unreadable without it.
APP_URL=$APP_URL
AUTH_SECRET=$(gen_secret)
ENCRYPTION_KEY=$(gen_secret)
WORKER_SLOTS=$(worker_slots)
LINKEDGROW_VERSION=$VERSION
DOMAIN=$DOMAIN
APP_BIND=$BIND
APP_PORT=$PORT
COMPOSE_PROFILES=$PROFILES
ENVFILE
  )
  say "Wrote $ENV_FILE with a new AUTH_SECRET and ENCRYPTION_KEY."
fi

[ -n "$(env_get AUTH_SECRET)" ] || env_set AUTH_SECRET "$(gen_secret)"
[ -n "$(env_get ENCRYPTION_KEY)" ] || env_set ENCRYPTION_KEY "$(gen_secret)"
[ -n "$(env_get WORKER_SLOTS)" ] || env_set WORKER_SLOTS "$(worker_slots)"
env_set APP_URL "$APP_URL"
env_set DOMAIN "$DOMAIN"
env_set APP_BIND "$BIND"
env_set APP_PORT "$PORT"
env_set COMPOSE_PROFILES "$PROFILES"
env_set LINKEDGROW_VERSION "$VERSION"

if [ "$PROFILES" = "https" ]; then
  PROFILE_ARGS="--profile https"
fi

# ---------- the domain really points here ----------

if [ -n "$DOMAIN" ]; then
  target=$(resolved_ip "$DOMAIN")
  if [ -z "$target" ]; then
    say "Warning: $DOMAIN does not resolve yet. Caddy cannot get a certificate until it does."
  elif [ "$target" != "$IP" ]; then
    say "Warning: $DOMAIN resolves to $target and this server answers on $IP. Point the A record here, or the certificate fails."
  fi
fi

# ---------- start ----------

if [ "$SOURCE" = "1" ]; then
  say "Building the images from the source in $DIR. Expect about 10 minutes."
  compose pull --ignore-pull-failures || true
  compose up -d --build || fail "The stack did not start. Run 'docker compose logs' in $DIR to see why."
else
  if [ "${LINKEDGROW_SKIP_PULL:-0}" != "1" ]; then
    say "Pulling the app, the worker and the database images."
    compose pull || fail "Could not pull the images. Sign in with 'docker login ghcr.io' or run the installer again with --source."
  fi
  say "Starting the containers."
  compose up -d || fail "The stack did not start. Run 'docker compose logs' in $DIR to see why."
fi

say "Waiting for the app to answer."
ready=0
i=0
while [ "$i" -lt 90 ]; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/api/health" 2>/dev/null || true)
  if [ "$code" = "200" ]; then
    ready=1
    break
  fi
  i=$((i + 1))
  sleep 2
done

if [ "$ready" != "1" ]; then
  fail "The app did not answer within 3 minutes. Run 'docker compose logs app' in $DIR to see why."
fi

say ""
say "LinkedGrow is running, so open $APP_URL in your browser."
say "The first account you create there is the administrator of this instance."
say "The wizard then asks for an AI key and for how you buy one dedicated address per LinkedIn account."
say "Update it later by running ./install.sh update inside $DIR."
say "The compose file and the .env of this instance live in $DIR."
