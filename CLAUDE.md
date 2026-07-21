# Alltrexx Live — Claude instructies

## Projectoverzicht
Realtime tracking-platform voor boten ⛵, fietsen 🚴, auto's 🚗, vliegtuigen ✈️,
personen 🚶 en treinen 🚆. Live kaart op **https://alltrexx.live**. Data komt uit
meerdere bronnen per type (AIS, ADS-B, mobiele app).

## Eigenaar
- **Ed Cafferata** (edcafferata@icloud.com)
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
  controller/  KaartController, TrackerController, AdminController, VliegtuigController,
               MobielController, SleutelController, GebruikerController
  scheduler/   AisHubScheduler, VliegtuigScheduler, KplerScheduler, MarineTrafficScheduler
  service/     TrackerService, VliegtuigService, MobielService, SleutelService, GebruikerService
  security/    AdminKey (herbruikbare X-Admin-Key-check)
  model/       Tracker (+ telefoon, token, abonnement), Positie, TrackerType, Gebruiker
  repository/  TrackerRepository, PositieRepository, GebruikerRepository
frontend/ React
  components/  TrackerKaart(.js/.css), BeheerBoten, BeheerGebruikers, VliegtuigZoek,
               BronnenTicker, Logboek, AccountMenu
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
| POST | `/api/sleutel/gratis` `{naam?,type?}` → tracker met UUID-token (FREE) | nee |
| POST | `/api/gebruikers/aanmelden` `{externeId,naam?,beheerder?}` (upsert) | nee |
| GET | `/api/gebruikers` · PUT `/{id}/abonnement` `{abonnement}` · DELETE `/{id}` | X-Admin-Key |
| POST | `/api/trackers/positie` | JWT (legacy) |

TrackerType: `BOAT` · `BIKE` · `CAR` · `PLANE` · `PERSON` · `TRAIN`

## Accounts, sleutel & abonnement (Free/Pro) — 29 juni 2026
- **Login** = CloudKit (Apple). Bij login meldt de frontend de gebruiker aan
  (`POST /api/gebruikers/aanmelden`) → minimaal serverrecord: opaak CloudKit-`externeId`
  + optioneel naam-label + `abonnement` (FREE/PRO) + `beheerder` + tijdstippen. Géén e-mail
  of trackdata op de server (trackdata blijft in CloudKit).
- **Free**: eigen voertuig & data + 📖 Logboek (type-keuze + periode dag/week/maand/alles;
  vliegtuig toont hoogte/koers). **Pro**: alle beheer-/kijk-opties (BeheerBoten, Gebruikers, …).
  Frontend gate: `isPro = abonnement==='PRO' || isBeheerder`. Echte beheer-API blijft
  X-Admin-Key-beveiligd.
- **CloudKit deelt het e-mailadres meestal NIET** → automatische beheerder→PRO-herkenning
  (`BEHEERDER_EMAIL` in cloudkit.js) vuurt vaak niet. Daarom: **`PRO_ACCOUNT_IDS`** (env,
  komma-gescheiden opake CloudKit-ID's) → die accounts krijgen bij aanmelden altijd
  PRO + beheerder. Staat in de NAS `.env` (niet in de repo), overleeft een verse DB.
  Pro ook handmatig te (de)activeren via het 👥 Gebruikers-scherm.
- 🔑 **Gratis sleutel** = `POST /api/sleutel/gratis` maakt een tracker met UUID-token; de
  mobiele app stuurt posities met die token (`/api/mobiel/positie`). Pro-sleutel = binnenkort.

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
  is `root:root` → docker vereist `sudo`. **Passwordless docker-sudo werkt** (NOPASSWD), maar
  **alleen voor `sudo /usr/local/bin/docker …` zelf**, niet voor `sudo sh script`.
- **Container Manager-project heet `alltrexx`** (NIET `alltrexx-live` van de compose-`name:`;
  een kale `docker compose up` botst dus). Restart (jar/frontend bind-mount):
  `ssh -i ~/.ssh/id_ed25519 Ed@192.168.1.179 'sudo /usr/local/bin/docker restart alltrexx-app'`.
  **Recreate** (compose-/env-wijziging), DB blijft draaien:
  `ssh … 'cd /volume1/Backup-Ed/alltrexx-nas && sudo /usr/local/bin/docker compose -p alltrexx up -d --remove-orphans'`.

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

## Security & performance-fix (21 juli 2026)
- **Alle Dependabot-alerts opgelost** (32 → 7 open, alle 7 bewust geaccepteerd):
  spring-boot-starter-parent → 3.2.12, h2 → 2.3.232, mysql-connector-j → 8.4.0,
  axios → ^1.18.0, plus `overrides` in frontend/package.json voor 10 transitieve
  npm-kwetsbaarheden. De 6 pom.xml-alerts (postgresql/devtools/mysql-connector-
  **java**) bleken een **stale GitHub dependency-graph-snapshot** te zijn — die
  packages stonden al niet meer in pom.xml; een push forceert een verse scan.
  **Bewust NIET gefixed:** webpack-dev-server naar v5 (6 medium alerts) en de
  svgo/@svgr-keten (1 high) — beide alleen bereikbaar via react-scripts' interne
  build/dev-tooling (nooit in de productie-bundle), en een "fix" zou `npm start`
  breken (v5 laat `onAfterSetupMiddleware` vallen) resp. react-scripts@0.0.0
  vereisen. Alleen op te lossen door van CRA te ejecten — niet vanavond gedaan.
- **PRODUCTIE-INCIDENT gevonden en opgelost:** `/api/kaart/live` en `/live/{type}`
  gebruikten een gecorreleerde subquery (`WHERE tijdstip = (SELECT MAX(...) ...)`)
  om de laatste positie per tracker te vinden. Bij 96k+ posities / 212 actieve
  trackers liep dit query-patroon vast (zelfs een kale `COUNT(*)` haalde de 20s-
  timeout niet — bevestigd via `EXPLAIN` op de live DB). Herschreven naar een
  niet-gecorreleerde JOIN met een `MAX(tijdstip)`-per-tracker-subquery in de
  FROM-clause (`PositieRepository.findLaatstePositiesActieveTrackers/PerType`,
  nu `nativeQuery = true`). Resultaat: van hangend/timeout → 1,6s op productie.
  **Let op bij toekomstige `Positie`-queries:** vermijd het "gecorreleerde
  subquery per rij"-patroon zodra de tabel groot wordt — gebruik de JOIN-vorm.
- **Drie lege Pro-knoppen afgemaakt** (deden nog niks): 🔍 Data zoeken
  (`DataZoeken.js`, hergebruikt `/kaart/route/{id}`), 📊 Rapportages
  (`Rapportages.js`, hergebruikt `/admin/trackers` + `/kaart/bronnen`),
  ⚙️ Instellingen (`Instellingen.js`, puur lokaal — admin-key/app-sleutel/
  toestemming beheren+wissen). Geen backend-wijziging nodig, alle drie op
  bestaande endpoints.

## Volgende stappen
- [ ] alltrexx_mobile koppelen via `/api/mobiel/positie` (toestel-token)
- [ ] Abonnement per toestel (gate op `actief`/token)
- [ ] Treinen/auto's databron onderzoeken (issue #9)
- [ ] Kpler-grant afwachten → KplerScheduler op OAuth ombouwen
- [ ] Off-site kopie van de db-backups (bv. naar een bucket)
- [ ] webpack-dev-server/svgo-alerts (dev-only) pas op te lossen via CRA-eject
      of migratie naar Vite — geen haast, niet productie-relevant
