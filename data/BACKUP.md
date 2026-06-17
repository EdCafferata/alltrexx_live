# Backup & herstel — Alltrexx Live

Twee lagen, beide op de NAS (overleven container/volume-wipes):

## 1. Volledige DB-backup (automatisch) — issue #5
Een los `backup`-containertje in `docker-compose.yml` draait **elk uur**
`mysqldump` van de hele `alltrexx`-database en schrijft een gzip-dump naar
`./db-backups/` op de NAS. De laatste **168** dumps (= 7 dagen) worden bewaard,
oudere worden automatisch opgeruimd. Zo blijft ALLE data bewaard — trackers
én de volledige positie-/track-historie — met max ~1 uur verlies bij een wipe.

- Locatie op de NAS: `/volume1/Backup-Ed/alltrexx-nas/db-backups/alltrexx-JJJJMMDD-UUMMSS.sql.gz`
- Bevat **alles**: trackers én positie-historie.

### Herstellen vanaf een dump (op de NAS, via SSH of Task Scheduler)
```bash
cd /volume1/Backup-Ed/alltrexx-nas
gunzip < db-backups/alltrexx-XXXXXXXX-XXXXXX.sql.gz \
  | sudo docker exec -i alltrexx-db mysql -u<DB_USERNAME> -p<DB_PASSWORD> alltrexx
```
(gebruikersnaam/wachtwoord staan in `.env`.)

## 2. Trackers-backup (snel, los) — voor alleen de boten/vliegtuigen
`data/boten-backup.json` bevat alle trackers (boten + vliegtuigen, met hun
MMSI/ICAO-hex/telefoon). Herstellen zonder DB-dump:
```bash
cd /Volumes/Backup-Ed/AI/alltrexx_live/data && ./restore-boten.sh
```
Dit POST't elke tracker naar `/api/admin/trackers` (upsert op externeId).
Posities komen daarna vanzelf terug via AIS/ADS-B (elke 15 min).

> Vuistregel: trackers = onvervangbaar (deze twee backups). Posities =
> regenereren vanzelf, dus minder kritiek.
