#!/bin/sh
# LinkedGrow self hosted installer.
#
#   curl -fsSL https://raw.githubusercontent.com/DigiHold/LinkedGrow/main/install.sh | sh
#   ./install.sh --domain linkedgrow.example.com
#   ./install.sh update
#
# It installs Docker when it is missing, fetches the compose file, pulls the
# published images, starts the stack and waits for it to answer. It writes no
# secret and no address: the app generates its own secrets on the first start
# and answers on whatever address you open. Run it again any time.
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
SOURCE=0
ASSUME_YES=0
KEEP_DATA=0
SUDO=""
DOCKER="docker"
PROFILE_ARGS=""
[ -z "${LINKEDGROW_DIR:-}" ] || DIR_GIVEN=1
[ -z "${LINKEDGROW_VERSION:-}" ] || VERSION_GIVEN=1
[ -z "${LINKEDGROW_PORT:-}" ] || PORT_GIVEN=1
[ -z "${LINKEDGROW_DOMAIN:-}" ] || DOMAIN_GIVEN=1

say() { printf '%s\n' "$1"; }
fail() { printf 'linkedgrow: %s\n' "$1" >&2; exit 1; }

usage() {
  cat <<'USAGE'
LinkedGrow self hosted installer.

Usage:
  install.sh [options]
  install.sh update [options]
  install.sh uninstall [--keep-data] [--yes]

Options:
  --domain NAME    Serve on this domain over https, with the built in Caddy.
  --no-domain      Serve on the server address over http, on the port below.
  --dir PATH       Where the stack lives. Default /opt/linkedgrow
  --version TAG    Image tag to run: latest, v1.0.0, sha-1a2b3c4. Default latest
  --port NUMBER    Port the app is published on. Default 3000
  --source         Build the images from the source instead of pulling them.
  --keep-data      With uninstall: stop and remove the containers, keep the volumes.
  --yes            Never ask anything. Needs --domain or --no-domain.
  --help           Print this and stop.

Environment: LINKEDGROW_DIR, LINKEDGROW_DOMAIN, LINKEDGROW_VERSION, LINKEDGROW_PORT.
USAGE
}

# ---------- arguments ----------

while [ "$#" -gt 0 ]; do
  case "$1" in
    update) MODE="update"; shift ;;
    uninstall) MODE="uninstall"; shift ;;
    --domain) [ "$#" -ge 2 ] || fail "The --domain option needs a domain name."; DOMAIN="$2"; DOMAIN_GIVEN=1; shift 2 ;;
    --domain=*) DOMAIN="${1#--domain=}"; DOMAIN_GIVEN=1; shift ;;
    --no-domain) DOMAIN=""; DOMAIN_GIVEN=1; shift ;;
    --dir) [ "$#" -ge 2 ] || fail "The --dir option needs a folder path."; DIR="$2"; DIR_GIVEN=1; shift 2 ;;
    --dir=*) DIR="${1#--dir=}"; DIR_GIVEN=1; shift ;;
    --version) [ "$#" -ge 2 ] || fail "The --version option needs an image tag."; VERSION="$2"; VERSION_GIVEN=1; shift 2 ;;
    --version=*) VERSION="${1#--version=}"; VERSION_GIVEN=1; shift ;;
    --port) [ "$#" -ge 2 ] || fail "The --port option needs a port number."; PORT="$2"; PORT_GIVEN=1; shift 2 ;;
    --port=*) PORT="${1#--port=}"; PORT_GIVEN=1; shift ;;
    --keep-data) KEEP_DATA=1; shift ;;
    --source) SOURCE=1; shift ;;
    --yes|-y) ASSUME_YES=1; shift ;;
    --help|-h) usage; exit 0 ;;
    *) fail "There is no option called $1. Run install.sh --help for the list." ;;
  esac
done

case "$PORT" in
  ''|*[!0-9]*) fail "The port must be a number, and $PORT is not." ;;
esac

# Whether the operator chose how to serve on THIS run, before the .env fills the
# blanks in. It decides if APP_BIND is allowed to move.
DOMAIN_GIVEN_ON_THIS_RUN="$DOMAIN_GIVEN"

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
# Same rule for the domain, so a rerun with no domain option keeps the one this
# instance already serves instead of silently dropping back to plain http.
if [ "$DOMAIN_GIVEN" = "0" ]; then
  previous_domain=$(env_get DOMAIN)
  if [ -n "$previous_domain" ]; then
    DOMAIN="$previous_domain"
    DOMAIN_GIVEN=1
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
  # A stack installed by hand has no .env at all, and --env-file on a missing
  # file stops Compose, so the flag is only passed when the file is there.
  env_arg=""
  [ -f "$ENV_FILE" ] && env_arg="--env-file $ENV_FILE"
  # shellcheck disable=SC2086
  $DOCKER compose --project-directory "$DIR" $COMPOSE_FILES $env_arg $PROFILE_ARGS "$@"
}

# ---------- uninstall ----------

# Trying a self hosted thing and being unable to remove it is a reason not to try
# the next one. This does what a reader would otherwise have to guess.
if [ "$MODE" = "uninstall" ]; then
  [ -f "$DIR/docker-compose.yml" ] || fail "There is no docker-compose.yml in $DIR, so there is nothing to remove here. Point at the right folder with --dir."
  if [ "$(env_get COMPOSE_PROFILES)" = "https" ]; then
    PROFILE_ARGS="--profile https"
  fi
  if [ "$KEEP_DATA" = "1" ]; then
    say "This removes the LinkedGrow containers in $DIR and keeps the volumes, so your accounts, agents and leads stay."
  else
    say "This removes the LinkedGrow containers in $DIR AND their volumes."
    say "Everything goes with them: your accounts, your agents, your leads, and the secrets that decrypt the stored keys."
    say "There is no undo. Add --keep-data to keep the volumes."
  fi
  if [ "$ASSUME_YES" != "1" ]; then
    [ -t 0 ] || fail "There is no terminal here to confirm. Add --yes if you mean it."
    printf 'Type "remove" to go ahead: '
    read -r answer
    [ "$answer" = "remove" ] || fail "Nothing was removed."
  fi
  if [ "$KEEP_DATA" = "1" ]; then
    compose down --remove-orphans || say "Could not stop the stack cleanly, carrying on."
  else
    compose down -v --remove-orphans || say "Could not stop the stack cleanly, carrying on."
  fi
  for image in ghcr.io/digihold/linkedgrow-app ghcr.io/digihold/linkedgrow-worker; do
    ids=$($DOCKER images -q "$image" 2>/dev/null || true)
    [ -n "$ids" ] && $DOCKER rmi -f $ids >/dev/null 2>&1 || true
  done
  say ""
  if [ "$KEEP_DATA" = "1" ]; then
    say "The containers and the images are gone. The volumes are still there, so running the installer again brings the instance back as it was."
  else
    say "The containers, the volumes and the images are gone."
  fi
  say "What is left is the folder $DIR, which holds docker-compose.yml and your .env. Remove it yourself when you are sure:"
  say "  rm -rf $DIR"
  exit 0
fi

# ---------- update ----------

if [ "$MODE" = "update" ]; then
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

# A rerun in a folder that already has a .env asks nothing: an empty DOMAIN in
# that file means this instance serves on the server address, and that stands.
if [ "$DOMAIN_GIVEN" = "0" ] && [ -f "$ENV_FILE" ]; then
  DOMAIN=$(env_get DOMAIN)
  DOMAIN_GIVEN=1
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

# Each slot is a Chrome, and a Chrome wants roughly 1.5 GB. What decides how many
# fit is the memory free right now, not the memory the machine was sold with: a
# box with 8 GB total and 1.3 GB free cannot run 4 of them, it will be killed.
worker_slots() {
  mb=0
  if [ -r /proc/meminfo ]; then
    mb=$(awk '/^MemAvailable:/ {print int($2 / 1024); exit}' /proc/meminfo)
    case "$mb" in
      ''|*[!0-9]*|0) mb=$(awk '/^MemTotal:/ {print int($2 / 1024); exit}' /proc/meminfo) ;;
    esac
  elif command -v sysctl >/dev/null 2>&1; then
    mb=$(sysctl -n hw.memsize 2>/dev/null | awk '{print int($1 / 1048576)}')
  fi
  case "$mb" in
    ''|*[!0-9]*) mb=0 ;;
  esac
  if [ "$mb" -ge 12288 ]; then
    printf '8'
  elif [ "$mb" -ge 6144 ]; then
    printf '4'
  elif [ "$mb" -ge 3072 ]; then
    printf '2'
  else
    printf '1'
  fi
}

IP=$(detect_ip)

PREVIOUS_PROFILES=$(env_get COMPOSE_PROFILES)

# The address is what this run prints at the end, and nothing else. The app
# never reads it: it answers on whatever address the browser asked for.
if [ -n "$DOMAIN" ]; then
  APP_ADDRESS="https://$DOMAIN"
  BIND="127.0.0.1"
  PROFILES="https"
else
  BIND="0.0.0.0"
  PROFILES=""
  if [ -n "$IP" ]; then
    APP_ADDRESS="http://$IP:$PORT"
  else
    APP_ADDRESS="port $PORT of this server"
  fi
fi

# ---------- is the port free ----------

# Docker's own message when the port is taken names neither this project nor the
# way out, and it is the first thing a reader meets on a server that already runs
# something. Say it before the stack tries and fails.
port_taken() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE "[:.]$1$"
  elif command -v netstat >/dev/null 2>&1; then
    netstat -an 2>/dev/null | grep -i listen | awk '{print $4}' | grep -qE "[:.]$1$"
  elif command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
  else
    return 1
  fi
}

if [ "$MODE" = "install" ] && port_taken "$PORT"; then
  if [ -f "$DIR/docker-compose.yml" ] && $DOCKER compose --project-directory "$DIR" ps -q 2>/dev/null | grep -q .; then
    : # our own stack already holds it, which is what a rerun looks like
  else
    say "Port $PORT is already used by something else on this server."
    say "Pick another one and the app follows, for example:"
    say "  ./install.sh --port 3001 --no-domain"
    say "With the compose file alone, write the port into .env next to docker-compose.yml instead:"
    say "  echo APP_PORT=3001 >> .env && docker compose up -d"
    fail "Nothing was changed. Rerun with a free port."
  fi
fi

# ---------- .env ----------

if [ -f "$ENV_FILE" ]; then
  say "Keeping the .env already in $DIR."
else
  (
  umask 077
  cat > "$ENV_FILE" <<ENVFILE
# Written by install.sh, and every line of it is optional. The 2 secrets are
# not here: the app generates them on its first start and keeps them inside the
# config volume, which is the one thing your backup must not miss.
WORKER_SLOTS=$(worker_slots)
LINKEDGROW_VERSION=$VERSION
DOMAIN=$DOMAIN
APP_BIND=$BIND
APP_PORT=$PORT
COMPOSE_PROFILES=$PROFILES
ENVFILE
  )
  chmod 600 "$ENV_FILE" 2>/dev/null || true
  say "Wrote $ENV_FILE with the settings this run worked out."
fi

[ -n "$(env_get WORKER_SLOTS)" ] || env_set WORKER_SLOTS "$(worker_slots)"
env_set DOMAIN "$DOMAIN"
# APP_BIND belongs to the operator once it exists. Somebody running their own
# nginx sets it to 127.0.0.1, and a rerun of this script used to reopen the port
# to the whole internet without saying so. It only moves when this run was told
# to change how the app is served.
previous_bind=$(env_get APP_BIND)
if [ -z "$previous_bind" ] || [ "$DOMAIN_GIVEN_ON_THIS_RUN" = "1" ]; then
  env_set APP_BIND "$BIND"
else
  BIND="$previous_bind"
  say "Keeping APP_BIND=$previous_bind from the .env. Pass --domain or --no-domain to change it."
fi
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
say "LinkedGrow is running, so open $APP_ADDRESS in your browser."
say "The first account you create there is the administrator of this instance."
say "The wizard then asks for an AI key and for how you buy one dedicated address per LinkedIn account."
say "Update it later by running ./install.sh update inside $DIR."
say "The compose file and the settings of this instance live in $DIR."
