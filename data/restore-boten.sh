#!/usr/bin/env bash
# Herstelt de 74 boten in de DB als die ooit leeg is (bv. na een volledige
# project-recreate die het DB-volume verving). Leest data/boten-backup.json en
# POST't elke boot naar /api/admin/trackers (upsert op externeId/AIS-nummer).
#
# Gebruik:  ADMIN_KEY=... ./restore-boten.sh   (of laat 'm de key uit ../.env halen)
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
BASE="${BASE:-https://alltrexx.live}"
ADMIN_KEY="${ADMIN_KEY:-$(grep -E '^ADMIN_API_KEY=' "$DIR/../.env" | cut -d= -f2-)}"

python3 -c "
import json
for t in json.load(open('$DIR/boten-backup.json')):
    print(json.dumps(t, ensure_ascii=True))
" | while IFS= read -r body; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 -X POST \
    -H "Content-Type: application/json" -H "X-Admin-Key: $ADMIN_KEY" \
    --data "$body" "$BASE/api/admin/trackers")
  [ "$code" = "200" ] && echo "ok" || echo "FAIL $code: $body"
done | sort | uniq -c
