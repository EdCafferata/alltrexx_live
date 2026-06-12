# Alltrexx Live op de Synology NAS

De frontend staat als statische preview op
**https://cafferata.info/alltrexx-live/** (map `/volume1/web/alltrexx-live/`).
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

## 3. Subdomein publiek maken (eenmalig in DSM)

Het DNS-record `alltrexx.cafferata.info` bestaat al en wijst naar de NAS.

1. **Configuratiescherm → Aanmeldingsportaal → Geavanceerd → Omgekeerde proxy**
   - Bron: HTTPS · `alltrexx.cafferata.info` · poort 443
   - Doel: HTTP · `localhost` · poort **3000**
2. **Configuratiescherm → Beveiliging → Certificaat**
   - Let's Encrypt-cert toevoegen voor `alltrexx.cafferata.info`
   - Onder Instellingen koppelen aan de reverse-proxy-regel

Daarna draait de volledige app op **https://alltrexx.cafferata.info** 🎉

## 4. Frontend-preview bijwerken (statische kopie op cafferata.info)

```bash
cd /Volumes/Backup-Ed/AI/alltrexx_live/frontend
CI= npm run build
rsync -a --delete build/ /Volumes/web/alltrexx-live/
```

Let op: in die statische preview werkt de kaart-UI, maar `/api`-data niet —
daarvoor is de Container Manager-stack + reverse proxy nodig (stap 2 + 3).

## Waar stond ook alweer wat?

| Plek | Inhoud |
|---|---|
| `/volume1/web/alltrexx-live/` | statische frontend-preview (publiek) |
| `/volume1/Backup-Ed/alltrexx-nas/` | Docker-project voor Container Manager (privé) |
| `/volume1/Backup-Ed/alltrexx-live-wordpress-backup/` | oude WordPress die eerst in de webmap stond |
