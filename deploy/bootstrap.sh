#!/usr/bin/env bash
#
# Turns a bare Debian 13 or Ubuntu 24.04 box into the LinkedGrow worker plane.
#
# Netcup ships Debian 13 by default, which is what lg-worker runs, and the two
# differ in exactly one package name, so the script detects rather than assumes.
#
# Run once, as root, on a fresh Netcup RS server:
#     curl -fsSL <this file> | bash
#   or, from a checkout:
#     bash deploy/bootstrap.sh
#
# What it installs and why, since every line here is a decision from the plan:
#
#   * Real Google Chrome, not Chromium. Patchright drives `channel: "chrome"`
#     and the two browsers differ in ways detection scripts read.
#   * Xvfb, because the browser runs headful. `--headless` is detectable on its
#     own, so the display is virtual rather than absent (plan section 8a).
#   * A dedicated unprivileged user. A browser that renders hostile pages all
#     day should not be root.
#   * A systemd unit with a long stop timeout. Chrome writes its cookie
#     database on graceful shutdown, so killing it mid-write corrupts a profile
#     and forces every account on it to re-authenticate from scratch, which is
#     the detection event the whole design avoids.
#
# It is idempotent: running it again upgrades rather than duplicates.

set -euo pipefail

WORKER_USER="${WORKER_USER:-linkedgrow}"
WORKER_HOME="/opt/linkedgrow"
PROFILE_ROOT="${WORKER_HOME}/profiles"
# Chrome's own home, deliberately not the account's.
#
# Chrome writes to $HOME whatever --user-data-dir says: the crashpad handler
# resolves its database there, and so do ~/.config, ~/.cache and ~/.pki. The
# service account's home is /home/linkedgrow, which ProtectHome=yes blanks and
# ProtectSystem=strict would leave read-only anyway, so Chrome died at launch
# for every account, every time, with nothing in its output but
# "chrome_crashpad_handler: --database is required". Pointing HOME inside the
# one writable path fixes it without giving the service any of /home back.
BROWSER_HOME="${WORKER_HOME}/home"
# Matches what the code is developed and tested against. Node 22 and Node 24 disagree about
# which TypeScript syntax --experimental-strip-types accepts, and the 22 box crashed on a
# constructor parameter property that 24 had run happily for weeks.
NODE_MAJOR=24

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

if [[ $EUID -ne 0 ]]; then
  echo "Run this as root." >&2
  exit 1
fi

say "System packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq --no-install-recommends \
  ca-certificates curl gnupg git unzip \
  xvfb x11-utils \
  fonts-liberation fonts-noto-color-emoji fonts-noto-cjk \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libpango-1.0-0 libcairo2 libatspi2.0-0 \
  restic jq

# The one package whose name differs between the two. Debian 13 and Ubuntu 24.04
# both did the 64-bit time_t transition, but older Debian did not, so ask apt
# which one exists rather than guessing.
if apt-cache show libasound2t64 >/dev/null 2>&1; then
  apt-get install -y -qq --no-install-recommends libasound2t64
else
  apt-get install -y -qq --no-install-recommends libasound2
fi

say "Node ${NODE_MAJOR}"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -c2- | cut -d. -f1)" -lt ${NODE_MAJOR} ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y -qq nodejs
fi
node -v

say "Google Chrome (stable)"
if ! command -v google-chrome >/dev/null 2>&1; then
  install -d -m 0755 /etc/apt/keyrings
  curl -fsSL https://dl.google.com/linux/linux_signing_key.pub |
    gpg --dearmor -o /etc/apt/keyrings/google-chrome.gpg
  echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/google-chrome.gpg] https://dl.google.com/linux/chrome/deb/ stable main" \
    >/etc/apt/sources.list.d/google-chrome.list
  apt-get update -qq
  apt-get install -y -qq google-chrome-stable
fi
google-chrome --version

say "Worker user and directories"
id -u "${WORKER_USER}" >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin "${WORKER_USER}"
mkdir -p "${WORKER_HOME}" "${PROFILE_ROOT}" "${BROWSER_HOME}"
chown -R "${WORKER_USER}:${WORKER_USER}" "${WORKER_HOME}"
# Profiles hold live session cookies, which are the credential. Nobody else reads them.
chmod 700 "${PROFILE_ROOT}"

say "Virtual display"
cat >/etc/systemd/system/xvfb.service <<'UNIT'
[Unit]
Description=Virtual framebuffer for the LinkedGrow worker
After=network.target

[Service]
# 1920x1080 because that is what the per-account fingerprints report, and a
# window larger than its own screen is a contradiction a detection script reads.
# 2560x1440 because the fingerprint pool contains a 2560x1440 machine and the
# window is sized from the machine. A window larger than the X screen is not
# clipped, Chrome dies at launch, so a smaller screen silently condemns every
# account whose id happens to hash to the biggest machine.
ExecStart=/usr/bin/Xvfb :99 -screen 0 2560x1440x24 -nolisten tcp -dpi 96
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
UNIT

say "Worker service"
cat >/etc/systemd/system/linkedgrow-worker.service <<UNIT
[Unit]
Description=LinkedGrow agent worker
After=network-online.target xvfb.service
Requires=xvfb.service
Wants=network-online.target

[Service]
Type=simple
User=${WORKER_USER}
WorkingDirectory=${WORKER_HOME}/app
Environment=DISPLAY=:99
# Inside ReadWritePaths, because Chrome needs a writable home and the sandbox
# below takes the real one away. See BROWSER_HOME at the top of this script.
Environment=HOME=${BROWSER_HOME}
# Read by the driver to bound the browser window to the screen. Keep it equal to
# the Xvfb geometry above.
Environment=SCREEN_SIZE=2560x1440
Environment=NODE_ENV=production
Environment=PROFILE_ROOT=${PROFILE_ROOT}
EnvironmentFile=${WORKER_HOME}/worker.env
ExecStart=/usr/bin/node --experimental-strip-types src/worker.ts

Restart=always
RestartSec=10

# Chrome flushes its cookie database on shutdown. Give the worker room to close
# every context cleanly; a SIGKILL here corrupts profiles and forces a fleet-wide
# re-login, which is worse than a slow restart by a wide margin.
KillSignal=SIGTERM
TimeoutStopSec=180
SendSIGKILL=yes

NoNewPrivileges=yes
PrivateTmp=yes
# Xvfb creates its socket at /tmp/.X11-unix/X99 in the real /tmp, and PrivateTmp
# gives this service a private one where that socket does not exist. Chrome then
# cannot reach the display and dies at launch, on every account, every time,
# with nothing in its output but a crashpad warning. Found 2026-07-31 after it
# blocked the first real sign-in for an hour.
BindReadOnlyPaths=/tmp/.X11-unix
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=${WORKER_HOME}

[Install]
WantedBy=multi-user.target
UNIT

if [[ ! -f "${WORKER_HOME}/worker.env" ]]; then
  say "Writing the environment template"
  cat >"${WORKER_HOME}/worker.env" <<'ENVFILE'
# Fill these in, then: systemctl restart linkedgrow-worker
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
ANTHROPIC_API_KEY=
# Must be the same 64 hex characters the dashboard uses, or the worker cannot
# read a single stored password.
ENCRYPTION_KEY=
PROXY_SELLER_API_KEY=
WORKER_ENV=production
ENVFILE
  chown "${WORKER_USER}:${WORKER_USER}" "${WORKER_HOME}/worker.env"
  chmod 600 "${WORKER_HOME}/worker.env"
fi

say "Nightly backup of the session profiles"
cat >/etc/systemd/system/linkedgrow-backup.service <<UNIT
[Unit]
Description=Back up LinkedGrow Chrome profiles

[Service]
Type=oneshot
User=${WORKER_USER}
EnvironmentFile=-${WORKER_HOME}/backup.env
# Only the parts that keep an account signed in. The rest of a Chrome profile
# is cache that rebuilds itself, so scoping the job keeps it small and the
# restore fast.
ExecStart=/usr/bin/restic backup ${PROFILE_ROOT} \\
  --exclude '*/Cache/*' --exclude '*/Code Cache/*' --exclude '*/GPUCache/*' \\
  --exclude '*/Service Worker/CacheStorage/*' --tag profiles
ExecStartPost=/usr/bin/restic forget --keep-daily 7 --keep-weekly 4 --prune
UNIT

cat >/etc/systemd/system/linkedgrow-backup.timer <<'UNIT'
[Unit]
Description=Nightly LinkedGrow profile backup

[Timer]
OnCalendar=*-*-* 03:20:00
RandomizedDelaySec=900
Persistent=true

[Install]
WantedBy=timers.target
UNIT

systemctl daemon-reload
systemctl enable --now xvfb.service

say "Done"
cat <<EOF

The box is ready. Three things left, in this order:

  1. Put the code in ${WORKER_HOME}/app
       git clone <repo> ${WORKER_HOME}/app && chown -R ${WORKER_USER}: ${WORKER_HOME}/app
       cd ${WORKER_HOME}/app && npm ci --omit=dev

  2. Fill ${WORKER_HOME}/worker.env, then
       systemctl enable --now linkedgrow-worker
       journalctl -u linkedgrow-worker -f

  3. Backups. Create ${WORKER_HOME}/backup.env with RESTIC_REPOSITORY and
     RESTIC_PASSWORD pointing at a Hetzner Storage Box or R2, run
       restic init
     once as ${WORKER_USER}, then
       systemctl enable --now linkedgrow-backup.timer

     Until that is done the profiles exist in exactly one place, and losing them
     means every customer's account re-authenticates on the same day.

EOF
