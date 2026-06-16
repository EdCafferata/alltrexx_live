# Alltrexx Live — Claude instructies

## Projectoverzicht
Route tracking platform voor boten ⛵, fietsen 🚴, auto's 🚗, vliegtuigen ✈️ en personen 🚶.
Live tracking kaart op alltrexx.live. Data via mobiele app + MarineTraffic API.

## Eigenaar
- **Ed Cafferata** (edcafferata@icloud.com)
- **Mede-eigenaar:** Jim Orie
- **Team ID:** `9J2S23WJH3`

## Locatie
- **Project:** `/Volumes/Backup-Ed/AI/alltrexx_live/`
- **GitHub:** https://github.com/EdCafferata/alltrexx_live — branch: `main`
- **NAS (gemount):** `/Volumes/web/alltrexx-live` (WordPress + straks Docker)

## Structuur
```
alltrexx_live/
  backend/          ← Spring Boot 3.2 / Java 21
  frontend/         ← React + Leaflet
  wordpress-plugin/ ← WP plugin [alltrexx_kaart]
  database/         ← MySQL init.sql
  docker-compose.yml
  start.sh          ← NAS startscript
  .env.example
```

## Stack
- Spring Boot 3.2 · Java 21 · JWT · Spring Data JPA
- MySQL 8 (prod) / H2 (dev)
- React 18 · Leaflet 1.9 · OpenStreetMap · OpenSeaMap
- Docker Compose (Synology Container Manager)
- MarineTraffic API (AIS)

## Sessie start
```bash
git -C /Volumes/Backup-Ed/AI/alltrexx_live pull origin main
```

## Starten NAS (Docker)
```bash
cd /Volumes/Backup-Ed/AI/alltrexx_live
cp .env.example .env && nano .env   # eenmalig: vul API keys in
./start.sh start
./start.sh logs      # logs volgen
./start.sh update    # pull + rebuild
./start.sh backup    # DB backup
```

## API endpoints
| Method | URL | Auth | |
|--------|-----|------|-|
| GET | `/api/kaart/live` | Nee | Alle live posities |
| GET | `/api/kaart/live/{type}` | Nee | Per type |
| GET | `/api/kaart/route/{id}?uur=24` | Nee | Route X uur |
| POST | `/api/trackers/positie` | JWT | Vanuit app |
| POST | `/api/trackers` | ADMIN | Tracker aanmaken |

## TrackerType: `BOAT` · `BIKE` · `CAR` · `PLANE` · `PERSON`

## WordPress plugin
- Geïnstalleerd: `/Volumes/web/alltrexx-live/wp-content/plugins/alltrexx-kaart/`
- Activeer via WP Admin → Plugins
- Shortcode: `[alltrexx_kaart hoogte="600"]`

## Volgende stappen
- [x] Docker installeren op Synology (Container Manager)
- [x] .env invullen en ./start.sh start uitvoeren
- [ ] WordPress plugin activeren
- [ ] MarineTraffic API key aanvragen
- [x] Boten toevoegen met MMSI nummer
- [ ] JWT auth overnemen uit master branch
- [ ] WebSockets voor echte live updates
- [ ] Alltrexx Mobile koppelen
