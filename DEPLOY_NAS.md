# Alltrexx Live op de Synology NAS

Live op **https://alltrexx.live**. De DSM reverse proxy stuurt
`alltrexx.live:443` → `localhost:8080`. Daar draait **één app-container** (Spring Boot)
die zowel de React-site als de `/api` serveert.

## Huidige opzet (stand 17 juni 2026)
Drie services in `docker-compose.yml` (projectmap `/volume1/Backup-Ed/alltrexx-nas/`):

| Service | Image | Rol |
|---|---|---|
| `database` | mysql:8.0 | MySQL, **named volume `alltrexx-db-fresh`**, poort 3306 (intern) |
| `app` | eclipse-temurin:21-jre | Spring Boot serveert site **én** API op 8080 |
| `backup` | mysql:8.0 | elk uur `mysqldump` → `./db-backups` (laatste 168 = 7 dagen) |

De `app`-container serveert de React-build via `SPRING_WEB_RESOURCES_STATIC_LOCATIONS=file:/static/`.
Geen aparte frontend/nginx-container meer.

## Bouwen = vooraf op de Mac (de NAS heeft geen build-DNS)
Container Manager kan tijdens een build geen hostnamen opzoeken. Daarom bouwen we
**lokaal** en koppelen we de artefacten als **bind-mounts**:

```bash
cd /Volumes/Backup-Ed/AI/alltrexx_live
cd backend && JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
  mvn clean package -DskipTests           # -> backend/target/alltrexx-live-1.0.0.jar
cd ../frontend && CI=false npm run build   # -> frontend/build/
# naar de NAS-projectmap:
rsync -a backend/target/alltrexx-live-1.0.0.jar /Volumes/Backup-Ed/alltrexx-nas/backend/target/
rsync -a --delete frontend/build/          /Volumes/Backup-Ed/alltrexx-nas/frontend/build/
```

## ⚠️ Belangrijke Synology-lessen
- **Build, géén project-delete.** Jar en frontend zijn bind-mounts → een **restart**
  pakt nieuwe artefacten. **Compose-wijzigingen (env, volumes, extra_hosts) vereisen een
  Build/recreate.** Container Manager toont soms een gecachete compose → controleer de
  YAML vóór je bouwt. Een **project-delete wist het named volume → alle data weg.**
- **DB op named volume, niet op bind-mount.** Een host bind-mount voor `/var/lib/mysql`
  faalt: de mysql-container (uid 999) mag de gedeelde map niet beschrijven ("verwijder de
  bestanden…" die je in File Station niet ziet). Named volume `alltrexx-db-fresh` werkt.
- **Container-DNS werkt niet** op deze NAS (egress wél). Alle externe hosts staan hard in
  `extra_hosts`: `data.aishub.net`, `hexdb.io`, `api.airplanes.live`. Nieuwe externe host
  = entry erbij + Build/recreate.
- **WebClient-buffer**: `SPRING_CODEC_MAX_IN_MEMORY_SIZE=16MB` (AISHub-respons > 256 KB
  default → anders "ophalen mislukt: 200 OK").
- **Tijdzone** `Europe/Amsterdam`: zowel `TZ`-env als hard in `AlltrexxApplication.main`.

## Container Manager
1. **Container Manager → Project** → open `alltrexx-live` (pad `/Backup-Ed/alltrexx-nas`).
2. Na een wijziging: **Build** (niet verwijderen). Drie containers komen op:
   `alltrexx-db`, `alltrexx-app` (8080), `alltrexx-backup`.
3. Controleer de YAML: `alltrexx-db-fresh:/var/lib/mysql`, de drie `extra_hosts`, en de
   env (`SPRING_PROFILES_ACTIVE=prod`, `SPRING_CODEC_MAX_IN_MEMORY_SIZE=16MB`, `TZ`).

## Reverse proxy & certificaat
- **Aanmeldingsportaal → Geavanceerd → Omgekeerde proxy:** HTTPS `alltrexx.live` 443 →
  HTTP `localhost` **8080**.
- Let's Encrypt-cert voor `alltrexx.live` (+ `www`) — HTTP-01 op poort 80.

| Poort | Publiek? | Waarvoor |
|---|---|---|
| 80 | ja | Let's Encrypt + http→https |
| 443 | ja | de site/app (HTTPS) |
| 8080 | nee | app-container — alleen intern (reverse proxy → localhost:8080) |
| 3306 | nee | MySQL — alleen intern |

## Backup & herstel
- Automatisch: `backup`-container, elk uur → `/volume1/Backup-Ed/alltrexx-nas/db-backups/`.
- Herstel + snelle trackers-restore: zie `data/BACKUP.md`.

## Waar staat wat?
| Plek | Inhoud |
|---|---|
| `/volume1/Backup-Ed/alltrexx-nas/` | Docker-project (compose, bind-mounts, `.env`, `db-backups/`) |
| `/volume1/web/alltrexx-live/` | (legacy) statische frontend-preview op de Web Station-vhost |
| `/volume1/Backup-Ed/alltrexx-live-wordpress-backup/` | oude WordPress |
