# Bouw handleiding — Alltrexx Live

## Vereisten
- **Java 21** (Temurin) + Maven — backend
- **Node 18+** + npm — frontend
- Docker / Synology Container Manager — productie

## Backend (Spring Boot)
```bash
cd backend
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
  mvn clean package -DskipTests      # -> target/alltrexx-live-1.0.0.jar
# lokaal draaien (H2): mvn spring-boot:run
```

## Frontend (React / CRA)
```bash
cd frontend
npm ci
npm start                            # dev op http://localhost:3000
CI=false npm run build               # productie -> build/
```

## Naar de NAS deployen (bind-mounts)
```bash
rsync -a backend/target/alltrexx-live-1.0.0.jar /Volumes/Backup-Ed/alltrexx-nas/backend/target/
rsync -a --delete frontend/build/ /Volumes/Backup-Ed/alltrexx-nas/frontend/build/
```
Daarna in Container Manager: **Build** (geen project-delete!). Jar/frontend worden via
bind-mount opgepakt bij een restart; compose-wijzigingen (env/volumes/extra_hosts)
vereisen een Build/recreate. Zie `DEPLOY_NAS.md`.

## Omgevingsvariabelen (`.env` op de NAS, `.env.example` als sjabloon)
| Variabele | Omschrijving |
|---|---|
| `DB_ROOT_PASSWORD` / `DB_USERNAME` / `DB_PASSWORD` | MySQL |
| `JWT_SECRET` | JWT (legacy positie-endpoint) |
| `ADMIN_API_KEY` | beheer-key (header `X-Admin-Key`) |
| `PRO_ACCOUNT_IDS` | vaste PRO-accounts: opake CloudKit-ID's, komma-gescheiden (leeg = geen) |
| `AISHUB_USERNAME` | AISHub station-handle (boten/AIS) |
| `KPLER_TOKEN` | Kpler (tweede AIS-bron, wacht op grant) |
| `MARINETRAFFIC_API_KEY` | MarineTraffic (legacy/uit) |
| `SPRING_PROFILES_ACTIVE=prod` | prod-config |
| `SPRING_CODEC_MAX_IN_MEMORY_SIZE=16MB` | grote AISHub-respons (>256 KB) |
| `TZ=Europe/Amsterdam` | tijdzone (ook hard in `main()` gezet) |

Frontend (`frontend/.env`, `REACT_APP_`-prefix): `REACT_APP_CLOUDKIT_CONTAINER`,
`REACT_APP_CLOUDKIT_API_TOKEN`, `REACT_APP_CLOUDKIT_ENV`, `REACT_APP_OPENAIP_KEY` (optioneel).

## Frontend bouwt op een Synology zonder build-DNS
Daarom **vooraf op de Mac bouwen** en de artefacten rsyncen (zie boven); de container
bouwt niet zelf. Externe hosts staan in `extra_hosts` omdat de container-DNS niet werkt.
