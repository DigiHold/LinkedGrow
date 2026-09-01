#!/usr/bin/env bash
# Installs a pre-push guard that refuses any push whose URL is not this checkout's expected remote.
# Usage: scripts/install-hooks.sh git@github.com:DigiHold/LinkedGrow.git
# The expected URL is given on the command line on purpose: the same script ships in the cloud
# repo, where the expected remote is LinkedGrow-Cloud, and nothing versioned should name it.
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "usage: $0 <expected push url>" >&2
  exit 2
fi

EXPECTED="$1"
ROOT="$(git rev-parse --show-toplevel)"
HOOK="$ROOT/.git/hooks/pre-push"

cat >"$HOOK" <<EOF
#!/usr/bin/env bash
# pre-push guard written by scripts/install-hooks.sh. \$1 is the remote name, \$2 its URL.
remote_url="\$2"
expected="$EXPECTED"
if [ "\$remote_url" != "\$expected" ]; then
  echo "pre-push guard: refusing to push to \$remote_url" >&2
  echo "pre-push guard: this checkout only pushes to \$expected" >&2
  exit 1
fi
EOF
chmod +x "$HOOK"
echo "pre-push guard installed: this checkout only pushes to $EXPECTED"
