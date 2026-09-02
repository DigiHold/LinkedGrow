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
DIR_GIVEN=0
DOMAIN="${LINKEDGROW_DOMAIN:-}"
DOMAIN_GIVEN=0
VERSION="${LINKEDGROW_VERSION:-latest}"
VERSION_GIVEN=0
PORT="${LINKEDGROW_PORT:-3000}"
PORT_GIVEN=0
EXPLICIT_ADDRESS=0
SOURCE=0
ASSUME_YES=0
SUDO=""
DOCKER="docker"
PROFILE_ARGS=""
[ -z "${LINKEDGROW_DIR:-}" ] || DIR_GIVEN=1
[ -z "${LINKEDGROW_VERSION:-}" ] || VERSION_GIVEN=1
[ -z "${LINKEDGROW_PORT:-}" ] || { PORT_GIVEN=1; EXPLICIT_ADDRESS=1; }
[ -z "${LINKEDGROW_DOMAIN:-}" ] || { DOMAIN_GIVEN=1; EXPLICIT_ADDRESS=1; }

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

while [ "$#" -gt 0 ]; do
  case "$1" in
    update) MODE="update"; shift ;;
    --domain) [ "$#" -ge 2 ] || fail "The --domain option needs a domain name."; DOMAIN="$2"; DOMAIN_GIVEN=1; EXPLICIT_ADDRESS=1; shift 2 ;;
    --domain=*) DOMAIN="${1#--domain=}"; DOMAIN_GIVEN=1; EXPLICIT_ADDRESS=1; shift ;;
    --no-domain) DOMAIN=""; DOMAIN_GIVEN=1; EXPLICIT_ADDRESS=1; shift ;;
    --dir) [ "$#" -ge 2 ] || fail "The --dir option needs a folder path."; DIR="$2"; DIR_GIVEN=1; shift 2 ;;
    --dir=*) DIR="${1#--dir=}"; DIR_GIVEN=1; shift ;;
    --version) [ "$#" -ge 2 ] || fail "The --version option needs an image tag."; VERSION="$2"; VERSION_GIVEN=1; shift 2 ;;
    --version=*) VERSION="${1#--version=}"; VERSION_GIVEN=1; shift ;;
    --port) [ "$#" -ge 2 ] || fail "The --port option needs a port number."; PORT="$2"; PORT_GIVEN=1; EXPLICIT_ADDRESS=1; shift 2 ;;
    --port=*) PORT="${1#--port=}"; PORT_GIVEN=1; EXPLICIT_ADDRESS=1; shift ;;
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

# A source build from a checkout runs in that checkout, where the Dockerfiles are,
# unless a folder was asked for by name.
if [ "$SOURCE" = "1" ] && [ -n "$CHECKOUT" ] && [ "$DIR_GIVEN" = "0" ]; then
  DIR="$CHECKOUT"
fi

# A copy of this script sits in the stack folder, so a run started from there
# works on that stack rather than on the default folder.
if [ "$DIR_GIVEN" = "0" ] && [ -n "$SELF_DIR" ] && [ -f "$SELF_DIR/.env" ] && [ -f "$SELF_DIR/docker-compose.yml" ]; then
  DIR="$SELF_DIR"
fi

ENV_FILE="$DIR/.env"

env_get() {
  [ -f "$ENV_FILE" ] || return 0
  sed -n "s/^$1=//p" "$ENV_FILE" | head -1
}

env_set() {
  if [ -f "$ENV_FILE" ] && grep -q "^$1=" "$ENV_FILE"; then
    ( umask 077; awk -v k="$1" -v v="$2" 'index($0, k "=") == 1 { print k "=" v; next } { print }' "$ENV_FILE" > "$ENV_FILE.tmp" )
    mv "$ENV_FILE.tmp" "$ENV_FILE"
  else
    ( umask 077; printf '%s=%s\n' "$1" "$2" >> "$ENV_FILE" )
  fi
  chmod 600 "$ENV_FILE" 2>/dev/null || true
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

# The image tag and the git ref are not the same string. A release image is
# tagged v1.0.0 and lives on the git tag v1.0.0, while sha-1a2b3c4 is the image
# of commit 1a2b3c4.
REF="main"
REF_IS_COMMIT=0
case "$VERSION" in
  latest|"") VERSION="latest" ;;
  v[0-9]*) REF="$VERSION" ;;
  sha-*) REF="${VERSION#sha-}"; REF_IS_COMMIT=1 ;;
  *) fail "The version $VERSION is not one this installer knows. Use latest, a release like v1.0.0, or a build like sha-1a2b3c4." ;;
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

# Writes to a temporary name first, so a failed download never truncates a file
# the stack is already running on. Returns 1 instead of stopping the run.
fetch_try() {
  if [ -n "$CHECKOUT" ]; then
    cp "$CHECKOUT/$1" "$2.new" 2>/dev/null || return 1
  else
    curl -fsL "$RAW/$1" -o "$2.new" || { rm -f "$2.new"; return 1; }
  fi
  mv "$2.new" "$2"
}

fetch() {
  fetch_try "$1" "$2" || fail "Could not get $1 at $REF. Check the version and the network, and sign in with a token while the repository is private."
}

# A source build needs the source in the stack folder, so any folder that is not
# already a checkout gets one.
if [ "$SOURCE" = "1" ] && [ "$DIR" != "$CHECKOUT" ]; then
  command -v git >/dev/null 2>&1 || fail "--source needs git and git is missing. Install git, then run this again."
  if [ -d "$DIR/.git" ]; then
    say "Updating the checkout in $DIR."
    if [ "$REF_IS_COMMIT" = "1" ]; then
      # A short commit is not something a remote will hand over on its own, so
      # the whole history comes down and the checkout happens locally.
      (cd "$DIR" && git fetch origin && git checkout -q "$REF") || fail "Could not check out $REF in $DIR."
    else
      (cd "$DIR" && git fetch --depth 1 origin "$REF" && git checkout -q FETCH_HEAD) || fail "Could not update the checkout in $DIR."
    fi
  else
    say "Cloning the source into $DIR."
    if [ "$REF_IS_COMMIT" = "1" ]; then
      git clone "https://github.com/$REPO.git" "$DIR" || fail "Could not clone $REPO over https. The repository is private until launch, so sign in with a token or install without --source."
      (cd "$DIR" && git checkout -q "$REF") || fail "The commit $REF is not in the repository."
    else
      git clone --depth 1 --branch "$REF" "https://github.com/$REPO.git" "$DIR" || fail "Could not clone $REPO over https at $REF. The repository is private until launch, so sign in with a token or install without --source."
    fi
  fi
  CHECKOUT="$DIR"
fi

# A file the stack does not have yet has to arrive. One it already has is only
# refreshed, so a rerun without a network keeps working on what is on disk.
place() {
  if [ -f "$2" ]; then
    fetch_try "$1" "$2" || say "Could not refresh $(basename "$2"), so this run keeps the one already in $DIR."
  else
    fetch "$1" "$2"
  fi
}

if [ "$MODE" = "install" ] && [ "$DIR" != "$CHECKOUT" ]; then
  place docker-compose.yml "$DIR/docker-compose.yml"
  place docker/Caddyfile "$DIR/Caddyfile"
  place install.sh "$DIR/install.sh"
  chmod +x "$DIR/install.sh"
  if [ "$SOURCE" = "1" ]; then
    place docker-compose.build.yml "$DIR/docker-compose.build.yml"
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
  if [ "$SOURCE" != "1" ] && [ "$DIR" != "$CHECKOUT" ]; then
    if fetch_try docker-compose.yml "$DIR/docker-compose.yml"; then
      if [ "$PROFILE_ARGS" = "--profile https" ]; then
        fetch_try docker/Caddyfile "$DIR/Caddyfile" || say "Could not refresh the Caddyfile, so the update keeps the one in $DIR."
      fi
    else
      say "Could not refresh docker-compose.yml, so the update keeps the file already in $DIR."
    fi
  fi
  if [ "$SOURCE" = "1" ]; then
    compose pull --ignore-pull-failures || true
    compose up -d --build --remove-orphans || fail "The stack did not start. Run 'docker compose logs' in $DIR to see why."
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

detect_ip() {
  ip=$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || true)
  case "$ip" in
    ''|*[!0-9.]*) ip="" ;;
  esac
  if [ -z "$ip" ] && command -v hostname >/dev/null 2>&1; then
    ip=$(hostname -I 2>/dev/null | awk '{print $1}')
  fi
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

IP=$(detect_ip)

PREVIOUS_PROFILES=$(env_get COMPOSE_PROFILES)
STORED_APP_URL=$(env_get APP_URL)

if [ -n "$DOMAIN" ]; then
  APP_URL="https://$DOMAIN"
  BIND="127.0.0.1"
  PROFILES="https"
else
  BIND="0.0.0.0"
  PROFILES=""
  if [ "$EXPLICIT_ADDRESS" = "0" ] && [ -n "$STORED_APP_URL" ]; then
    # A rerun that says nothing about the address keeps the one people already use.
    APP_URL="$STORED_APP_URL"
  else
    [ -n "$IP" ] || fail "Could not work out the address of this server. Rerun with --domain example.com, or write APP_URL into .env yourself."
    APP_URL="http://$IP:$PORT"
  fi
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
  chmod 600 "$ENV_FILE" 2>/dev/null || true
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

if [ "$PREVIOUS_PROFILES" = "https" ] && [ -z "$PROFILES" ]; then
  say "Removing the Caddy container, which held ports 80 and 443 for the old domain."
  PROFILE_ARGS="--profile https"
  compose rm -sf caddy >/dev/null 2>&1 || true
  PROFILE_ARGS=""
fi

if [ "$PROFILES" = "https" ]; then
  PROFILE_ARGS="--profile https"
fi

# ---------- the domain really points here ----------

if [ -n "$DOMAIN" ]; then
  target=$(resolved_ip "$DOMAIN")
  if [ -z "$target" ]; then
    say "Warning: $DOMAIN does not resolve yet. Caddy cannot get a certificate until it does."
  elif [ -z "$IP" ]; then
    say "Warning: this server did not report a public address, so the domain could not be checked against it."
  elif [ "$target" != "$IP" ]; then
    say "Warning: $DOMAIN resolves to $target and this server answers on $IP. Point the A record here, or the certificate fails."
  fi
fi

# ---------- start ----------

if [ "$SOURCE" = "1" ]; then
  say "Building the images from the source in $DIR. Expect about 10 minutes."
  compose pull --ignore-pull-failures || true
  compose up -d --build --remove-orphans || fail "The stack did not start. Run 'docker compose logs' in $DIR to see why."
else
  if [ "${LINKEDGROW_SKIP_PULL:-0}" != "1" ]; then
    say "Pulling the app, the worker and the database images."
    compose pull || fail "Could not pull the images. Sign in with 'docker login ghcr.io' or run the installer again with --source."
  fi
  say "Starting the containers."
  compose up -d --remove-orphans || fail "The stack did not start. Run 'docker compose logs' in $DIR to see why."
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
  say "The app did not answer within 3 minutes. Its last 50 log lines follow."
  compose logs --tail 50 app || true
  fail "The app is not answering on port $PORT. The lines above say why, and the stack is still up in $DIR."
fi

say ""
say "LinkedGrow is running, so open $APP_URL in your browser."
say "The first account you create there is the administrator of this instance."
say "The wizard then asks for an AI key and for how you buy one dedicated address per LinkedIn account."
say "Update it later by running ./install.sh update inside $DIR."
say "The compose file and the .env of this instance live in $DIR."
