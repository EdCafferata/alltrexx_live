# Alltrexx Live — Claude instructies

## Projectoverzicht
Realtime tracking-platform voor boten ⛵, fietsen 🚴, auto's 🚗, vliegtuigen ✈️,
personen 🚶 en treinen 🚆. Live kaart op **https://alltrexx.live**. Data komt uit
meerdere bronnen per type (AIS, ADS-B, mobiele app).

## Eigenaar
- **Ed Cafferata** (edcafferata@icloud.com) · **Mede-eigenaar:** Jim Orie
- **Team ID:** `9J2S23WJH3` · Ondersteund door The IT Crowd

## Locatie & deploy
- **Project (Mac):** `/Volumes/Backup-Ed/AI/alltrexx_live/`
- **GitHub:** https://github.com/EdCafferata/alltrexx_live — branch `main`
- **NAS-projectmap (gemount):** `/Volumes/Backup-Ed/alltrexx-nas/` (= `/volume1/Backup-Ed/alltrexx-nas/`)
  — bevat `.env` met echte keys, de bind-mounts en `docker-compose.yml`.

## Stack
- Spring Boot 3.2 · Java 21 · Spring Data JPA · WebClient (reactor)
- MySQL 8 (prod, named volume) / H2 (dev)
- React 18 · Leaflet 1.9 · OpenStreetMap/OpenSeaMap/CyclOSM/OpenTopoMap/OpenRailwayMap
- Docker Compose op Synology Container Manager: **één app-container** (serveert site+API
  op 8080) + `database` + `backup`. Reverse proxy alltrexx.live:443 → localhost:8080.
- CloudKit (Apple Sign In, alleen login — geen trackdata op de server)

## Databronnen (elk een eigen scheduler, elke 15 min)
| Type | Bron | Sleutel = externeId | bron-tag |
|---|---|---|---|
| ⛵ Boot | AISHub (gratis, `AISHUB_USERNAME`=`AH_2596_23A5E304`) | MMSI | AISHUB |
| ✈️ Vliegtuig | airplanes.live (gratis, geen key) | ICAO 24-bit hex (lowercase) | ADSB |
| 🚶🚴🚗 | mobiele app (toestel-token) | telefoonnummer | MOBIEL |
| ⛵ (2e) | Kpler/MarineTraffic (wacht op grant) | MMSI | KPLER |
- Registratie→ICAO-hex: hexdb.io via `GET /api/admin/vliegtuig/icao?reg=PH-USN`.
- AISHub: max 1 request/min; respons ~2,6 MB → `SPRING_CODEC_MAX_IN_MEMORY_SIZE=16MB`.

## Structuur (modulair — kleine losse bestanden)
```
backend/  Spring Boot
  controller/  KaartController, TrackerController, AdminController,
               VliegtuigController, MobielController
  scheduler/   AisHubScheduler, VliegtuigScheduler, KplerScheduler, MarineTrafficScheduler
  service/     TrackerService, VliegtuigService, MobielService
  security/    AdminKey (herbruikbare X-Admin-Key-check)
  model/       Tracker (+ telefoon, token), Positie, TrackerType
frontend/ React
  components/  TrackerKaart(.js/.css), BeheerBoten, VliegtuigZoek, BronnenTicker,
               AccountMenu
  services/    api.js, cloudkit.js
  public/      index.html, logo-alltrexx.png, favicon.png, apple-touch-icon.png
data/     boten-backup.json, restore-boten.sh, BACKUP.md
docker-compose.yml · database/init.sql
```
`AlltrexxApplication.main` zet `TimeZone.setDefault("Europe/Amsterdam")` (NL-tijd in posities).

## API endpoints
| Method | URL | Auth |
|--------|-----|------|
| GET | `/api/kaart/live` · `/live/{type}` · `/route/{id}?uur=` · `/bronnen` | nee |
| GET/POST | `/api/admin/trackers` · DELETE `/{id}` · DELETE `/{id}/posities` | X-Admin-Key |
| GET | `/api/admin/vliegtuig/icao?reg=` | X-Admin-Key |
| POST | `/api/mobiel/positie` `{token,lat,lon,snelheid?,koers?,hoogte?}` | toestel-token |
| POST | `/api/trackers/positie` | JWT (legacy) |

TrackerType: `BOAT` · `BIKE` · `CAR` · `PLANE` · `PERSON` · `TRAIN`

## Bouwen & deployen (zie ook DEPLOY_NAS.md, BOUW_HANDLEIDING.md)
```bash
# Backend jar
cd backend && JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
  mvn clean package -DskipTests        # -> target/alltrexx-live-1.0.0.jar
# Frontend
cd ../frontend && CI=false npm run build   # -> build/
# Naar de NAS (bind-mounts):
rsync -a backend/target/alltrexx-live-1.0.0.jar /Volumes/Backup-Ed/alltrexx-nas/backend/target/
rsync -a --delete frontend/build/ /Volumes/Backup-Ed/alltrexx-nas/frontend/build/
```
- **Jar/frontend = bind-mounts** → een **restart** pakt ze. **Compose-wijzigingen
  (env/volumes/extra_hosts) vereisen Build/recreate.** **Build, géén project-delete**
  (delete = named volume `alltrexx-db-fresh` weg = data weg).
- **Container-DNS werkt niet** → externe hosts staan in `extra_hosts` (data.aishub.net,
  hexdb.io, api.airplanes.live).

## NAS-toegang (29 juni 2026)
- **NAS:** `192.168.1.179` (KROON-9-NAS, LAN). SSH-user **`Ed`** (administrators).
  Passwordless SSH-sleutel staat geïnstalleerd: `ssh -i ~/.ssh/id_ed25519 Ed@192.168.1.179`.
- **Docker** zit op `/usr/local/bin/docker` (niet in non-interactief PATH) en `docker.sock`
  is `root:root` → **docker vereist `sudo`** (NOPASSWD is niet ingesteld). Docker-commando's
  dus zelf draaien in Terminal: `ssh -t Ed@192.168.1.179 'sudo /usr/local/bin/docker …'`.
- **Container Manager-project heet NIET `alltrexx-live`** (CM gebruikt een eigen projectnaam).
  Een `docker compose up` met de compose-`name:` botst daarom ("name already in use").
  Recreate via CLI met de gedetecteerde projectnaam: `docker compose -p <CM-naam> up -d`,
  óf via de Container Manager GUI (Project > Build). Helper-script op de NAS:
  `~/alltrexx-rebuild.sh` (detecteert de projectnaam zelf) → `sudo sh ~/alltrexx-rebuild.sh`.

## Backup (issue #5) — ACTIEF sinds 29 juni 2026
- `backup`-container draait: elk uur `mysqldump` → `./db-backups` (laatste 168 = 7 dagen).
  Geverifieerd: dumps ~360 KB (77 trackers + ~18k posities). `TZ=Europe/Amsterdam` zodat
  de timestamp in de bestandsnaam de wandklok volgt.
- Handmatige dump: `ssh -t Ed@192.168.1.179 'sudo sh ~/alltrexx-backup.sh'` (script leest het
  root-wachtwoord uit de container, dumpt → `db-backups/alltrexx-handmatig-<ts>.sql.gz`).
- Restore: `gzip -dc <dump>.sql.gz | sudo /usr/local/bin/docker exec -i alltrexx-db mysql -uroot -p<pw> alltrexx`.
- Snelle trackers-restore: `cd data && ./restore-boten.sh` (leest `.env`, upsert op externeId).
- `data/boten-backup.json` bevat alle trackers (boten + vliegtuigen).

## Sessie start / einde
```bash
git -C /Volumes/Backup-Ed/AI/alltrexx_live pull origin main
# … einde: commit + push; werk CLAUDE.md / ONTWERP_KEUZES.md bij
```

## Volgende stappen
- [ ] alltrexx_mobile koppelen via `/api/mobiel/positie` (toestel-token)
- [ ] Abonnement per toestel (gate op `actief`/token)
- [ ] Treinen/auto's databron onderzoeken (issue #9)
- [ ] Kpler-grant afwachten → KplerScheduler op OAuth ombouwen
- [ ] Off-site kopie van de db-backups (bv. naar een bucket)
