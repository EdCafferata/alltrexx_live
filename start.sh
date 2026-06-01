#!/bin/bash
# ══════════════════════════════════════════════════════════════════
#  Alltrexx Live — startscript voor NAS / Linux server
#  Gebruik: ./start.sh [start|stop|restart|status|logs]
# ══════════════════════════════════════════════════════════════════

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Kleuren
GRN='\033[0;32m'; YEL='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()  { echo -e "${GRN}✅  $*${NC}"; }
wrn() { echo -e "${YEL}⚠️   $*${NC}"; }
err() { echo -e "${RED}❌  $*${NC}"; exit 1; }

# ── .env laden ────────────────────────────────────────────────────
if [ ! -f .env ]; then
    wrn ".env niet gevonden — kopieer .env.example naar .env en vul in"
    cp .env.example .env
    echo ""
    echo "➡️  Bewerk .env met jouw instellingen en start opnieuw:"
    echo "   nano .env"
    echo "   ./start.sh start"
    exit 0
fi
export $(grep -v '^#' .env | xargs)

# ── Docker check ──────────────────────────────────────────────────
check_docker() {
    if ! command -v docker &> /dev/null; then
        err "Docker niet gevonden. Installeer Docker of gebruik Synology Container Manager."
    fi
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
        err "Docker Compose niet gevonden."
    fi
    ok "Docker beschikbaar"
}

COMPOSE="docker compose"
command -v docker-compose &>/dev/null && COMPOSE="docker-compose"

# ── Commando's ────────────────────────────────────────────────────
case "${1:-start}" in

start)
    check_docker
    echo ""
    echo "⚓  Alltrexx Live starten..."
    echo ""
    $COMPOSE up -d --build
    echo ""
    ok "Alltrexx Live draait!"
    echo ""
    echo "  🌐 Frontend:  http://$(hostname -I | awk '{print $1}'):3000"
    echo "  🔧 Backend:   http://$(hostname -I | awk '{print $1}'):8080"
    echo "  🗄️  H2 console: http://$(hostname -I | awk '{print $1}'):8080/h2"
    echo ""
    echo "  Logs bekijken: ./start.sh logs"
    ;;

stop)
    echo "🛑 Alltrexx Live stoppen..."
    $COMPOSE down
    ok "Gestopt"
    ;;

restart)
    echo "🔄 Herstarten..."
    $COMPOSE down
    $COMPOSE up -d --build
    ok "Herstart klaar"
    ;;

status)
    $COMPOSE ps
    ;;

logs)
    $COMPOSE logs -f --tail=100 "${2:-backend}"
    ;;

update)
    echo "⬇️  Laatste versie ophalen van GitHub..."
    git pull origin main
    echo "🔨 Opnieuw bouwen en starten..."
    $COMPOSE up -d --build
    ok "Update klaar"
    ;;

backup)
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
    echo "💾 Database backup naar $BACKUP_FILE..."
    $COMPOSE exec database mysqldump -u root -p"${DB_ROOT_PASSWORD}" alltrexx > "$BACKUP_FILE"
    ok "Backup opgeslagen: $BACKUP_FILE"
    ;;

*)
    echo "Gebruik: ./start.sh [start|stop|restart|status|logs|update|backup]"
    ;;
esac
