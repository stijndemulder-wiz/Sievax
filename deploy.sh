#!/usr/bin/env bash
# Publiceer sievax.academy naar Combell.
#
# Tijdelijke oplossing: autogit weigert te deployen omdat sievax.academy op dit
# pakket een subsite is en de activatie de verkeerde docroot voorbereidde
# (zie docs/DEPLOY-COMBELL.md). Tot Combell dat rechtzet, kopieert dit script de
# docroot rechtstreeks met rsync.
#
#   ./deploy.sh            toont wat er zou veranderen (droogloop)
#   ./deploy.sh --live     voert het echt uit
#
# Wat NIET meegaat: .env en storage/ staan buiten www/ en blijven op de server
# staan. Dit script wist niets op de server (geen --delete), dus een bestand dat
# je lokaal verwijdert, moet je daar handmatig weghalen.

set -euo pipefail
cd "$(dirname "$0")"

HOST=sievaxbe@ssh083.webhosting.be
DEST=subsites/sievax.academy/

FLAGS=(-rltz --chmod=D755,F644 --exclude='.DS_Store' --itemize-changes)
if [[ "${1:-}" == "--live" ]]; then
  echo "→ publiceren naar $HOST:$DEST"
else
  FLAGS+=(--dry-run)
  echo "→ DROOGLOOP (voeg --live toe om echt te publiceren)"
fi

rsync "${FLAGS[@]}" -e ssh www/ "$HOST:$DEST"

if [[ "${1:-}" == "--live" ]]; then
  echo
  printf 'sievax.academy → '; curl -s -o /dev/null -w '%{http_code}\n' --max-time 20 https://sievax.academy/
  printf 'sievax.be      → '; curl -s -o /dev/null -w '%{http_code}\n' --max-time 20 https://sievax.be/
fi
