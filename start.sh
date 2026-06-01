#!/bin/bash
# ══════════════════════════════════════════════════════════════════
#  Alltrexx Live — startscript
#  Gebruik: ./start.sh [dev|start|stop|restart|status|logs|update|backup]
#
#  dev   = lokaal starten zonder Docker (Mac / dev omgeving)
#  start = starten via Docker Compose (NAS / productie)
# ══════════════════════════════════════════════════════════════════

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Kleuren
GRN='\033[0;32m'; YEL='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()  { echo -e "${GRN}✅  $*${NC}"; }
wrn() { echo -e "${YEL}⚠️   $*${NC}"; }
err() { echo -e "${RED}❌  $*${NC}"; exit 1; }

# ── .env laden (als aanwezig) ─────────────────────────────────────
[ -f .env ] && export $(grep -v '^#' .env | xargs 2>/dev/null)

# ── Java / Maven paden (Homebrew) ─────────────────────────────────
for JH in /opt/homebrew/opt/openjdk@21 /usr/local/opt/openjdk@21 \
          /opt/homebrew/opt/openjdk     /usr/local/opt/openjdk; do
    [ -f "$JH/bin/java" ] && export JAVA_HOME="$JH" && break
done
[ -n "$JAVA_HOME" ] && export PATH="$JAVA_HOME/bin:$PATH"

MVN=$(command -v mvn 2>/dev/null || echo "")
NODE=$(command -v node 2>/dev/null || echo "")
NPM=$(command -v npm 2>/dev/null || echo "")

# ── Docker ────────────────────────────────────────────────────────
COMPOSE=""
if command -v docker &>/dev/null; then
    if command -v docker-compose &>/dev/null; then
        COMPOSE="docker-compose"
    elif docker compose version &>/dev/null 2>&1; then
        COMPOSE="docker compose"
    fi
fi

# ══════════════════════════════════════════════════════════════════
case "${1:-dev}" in

# ── DEV: lokaal starten zonder Docker ─────────────────────────────
dev)
    [ -z "$JAVA_HOME" ] && err "Java 21 niet gevonden. Installeer via: brew install openjdk@21"
    [ -z "$MVN" ]       && err "Maven niet gevonden. Installeer via: brew install maven"
    [ -z "$NPM" ]       && err "Node/npm niet gevonden. Installeer via: brew install node"

    ok "Java: $($JAVA_HOME/bin/java -version 2>&1 | head -1)"
    ok "Maven: $(mvn -version 2>&1 | head -1)"
    ok "Node: $(node -v)"

    echo ""
    echo "⚓  Alltrexx Live (DEV) starten..."
    echo ""

    # Backend in achtergrond
    echo "🔧 Backend starten (Spring Boot)..."
    cd "$DIR/backend"
    mvn spring-boot:run -q &
    BACKEND_PID=$!
    echo "   PID: $BACKEND_PID"

    # Wacht tot backend klaar is
    echo "   Wachten op backend..."
    for i in $(seq 1 30); do
        sleep 2
        curl -sf http://localhost:8080/api/kaart/live > /dev/null 2>&1 && break
        [ $i -eq 30 ] && wrn "Backend reageert nog niet — frontend toch starten"
    done

    # Frontend
    echo ""
    echo "🌐 Frontend starten (React)..."
    cd "$DIR/frontend"
    npm install --silent 2>/dev/null
    npm start &
    FRONTEND_PID=$!

    echo ""
    ok "Alltrexx Live draait!"
    echo ""
    echo "  🌐 Frontend:   http://localhost:3000"
    echo "  🔧 Backend:    http://localhost:8080"
    echo "  🗄️  H2 console: http://localhost:8080/h2"
    echo ""
    echo "  Stoppen: druk Ctrl+C"
    echo ""

    # Wacht op Ctrl+C
    trap "echo ''; echo '🛑 Stoppen...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; ok 'Gestopt'" INT
    wait
    ;;

# ── START: via Docker (NAS / productie) ───────────────────────────
start)
    [ -z "$COMPOSE" ] && err "Docker niet gevonden. Gebruik './start.sh dev' voor lokaal starten."

    if [ ! -f .env ]; then
        wrn ".env niet gevonden — aanmaken uit voorbeeld"
        # Gebruik sed i.p.v. cp om extended attribute problemen te vermijden
        sed '' .env.example > .env 2>/dev/null || cat .env.example > .env
        echo ""
        echo "➡️  Bewerk .env en start opnieuw: nano .env && ./start.sh start"
        exit 0
    fi

    echo "⚓  Alltrexx Live starten via Docker..."
    $COMPOSE up -d --build
    echo ""
    ok "Alltrexx Live draait!"
    echo ""
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ipconfig getifaddr en0 2>/dev/null || echo "localhost")
    echo "  🌐 Frontend:   http://$LOCAL_IP:3000"
    echo "  🔧 Backend:    http://$LOCAL_IP:8080"
    echo "  Logs: ./start.sh logs"
    ;;

stop)
    [ -z "$COMPOSE" ] && err "Docker niet gevonden."
    echo "🛑 Stoppen..."
    $COMPOSE down
    ok "Gestopt"
    ;;

restart)
    [ -z "$COMPOSE" ] && err "Docker niet gevonden."
    $COMPOSE down && $COMPOSE up -d --build
    ok "Herstart klaar"
    ;;

status)
    [ -z "$COMPOSE" ] && err "Docker niet gevonden."
    $COMPOSE ps
    ;;

logs)
    [ -z "$COMPOSE" ] && err "Docker niet gevonden."
    $COMPOSE logs -f --tail=100 "${2:-backend}"
    ;;

update)
    echo "⬇️  Laatste versie ophalen..."
    git pull origin main
    if [ -n "$COMPOSE" ]; then
        $COMPOSE up -d --build
    fi
    ok "Update klaar"
    ;;

backup)
    [ -z "$COMPOSE" ] && err "Docker niet gevonden."
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
    $COMPOSE exec database mysqldump -u root -p"${DB_ROOT_PASSWORD}" alltrexx > "$BACKUP_FILE"
    ok "Backup: $BACKUP_FILE"
    ;;

*)
    echo "Gebruik: ./start.sh [dev|start|stop|restart|status|logs|update|backup]"
    echo ""
    echo "  dev     → lokaal starten (Mac, geen Docker nodig)"
    echo "  start   → starten via Docker (NAS/productie)"
    ;;
esac
