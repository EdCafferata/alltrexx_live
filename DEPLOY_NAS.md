# Alltrexx Live op de Synology NAS

Het domein is **https://alltrexx.live** — de Web Station-vhost daarvan wijst naar
`/volume1/web/alltrexx-live/`, waar de statische frontend-build staat (UI-preview).
De volledige app (mét live data) draait via **Container Manager**.

## 1. Projectbestanden

Het complete project staat klaar op de NAS in:

```
/volume1/Backup-Ed/alltrexx-nas/
```

(inclusief `.env` met de echte keys — daarom staat dit NIET in de publieke webroot)

## 2. Container Manager (DSM)

1. Open **Container Manager → Project → Aanmaken**
2. Projectnaam: `alltrexx-live`
3. Pad: `/Backup-Ed/alltrexx-nas`
4. Bron: `docker-compose.yml` wordt automatisch gevonden
5. Start het project — drie containers komen op:
   - `alltrexx-db` (MySQL 8, poort 3306)
   - `alltrexx-backend` (Spring Boot, poort 8080)
   - `alltrexx-frontend` (nginx met de React-build, **poort 3000**)

De frontend-container proxy't `/api/` zelf naar de backend — geen extra
configuratie nodig.

## 3. alltrexx.live op de containers aansluiten (eenmalig in DSM)

DNS van `alltrexx.live` + `www` wijst al naar de NAS (82.172.143.72).

1. **Configuratiescherm → Beveiliging → Certificaat**
   - Let's Encrypt-cert toevoegen voor `alltrexx.live` (+ `www.alltrexx.live`)
   - Nu serveert het domein nog het cafferata.info-cert → browsers waarschuwen
2. Zolang alleen de statische preview nodig is: klaar — de bestaande
   Web Station-vhost serveert `/volume1/web/alltrexx-live/` (cert koppelen onder
   Certificaat → Instellingen).
3. Zodra de containers draaien en de échte app live moet:
   - Web Station-vhost voor `alltrexx.live` **uitschakelen/verwijderen**
   - **Aanmeldingsportaal → Geavanceerd → Omgekeerde proxy** → regel toevoegen:
     bron HTTPS `alltrexx.live` poort 443 → doel HTTP `localhost` poort **3000**
   - Cert opnieuw koppelen aan de reverse-proxy-regel

Daarna draait de volledige app op **https://alltrexx.live** 🎉

## 4. Frontend-preview bijwerken (statische kopie op cafferata.info)

```bash
cd /Volumes/Backup-Ed/AI/alltrexx_live/frontend
CI= npm run build
rsync -a --delete build/ /Volumes/web/alltrexx-live/
```

Let op: in die statische preview werkt de kaart-UI, maar `/api`-data niet —
daarvoor is de Container Manager-stack + reverse proxy nodig (stap 2 + 3).
De preview is bereikbaar op https://alltrexx.live (eigen vhost).

## Waar stond ook alweer wat?

| Plek | Inhoud |
|---|---|
| `/volume1/web/alltrexx-live/` | docroot van alltrexx.live — statische frontend-preview |
| `/volume1/Backup-Ed/alltrexx-nas/` | Docker-project voor Container Manager (privé) |
| `/volume1/Backup-Ed/alltrexx-live-wordpress-backup/` | oude WordPress die eerst in de webmap stond |
