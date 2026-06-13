# Alltrexx Live op de Synology NAS

Het domein is **https://alltrexx.live** — de Web Station-vhost daarvan wijst naar
`/volume1/web/alltrexx-live/`, waar de statische frontend-build staat (UI-preview).
De volledige app (mét live data) draait via **Container Manager**.

## ✅ TODO — wat Ed nog moet doen (stand 12 juni 2026)

1. **[router] Poort 8080 dichtzetten.** Niet nodig voor Let's Encrypt en niet voor
   de frontend (die roept `/api` same-origin aan, dus via 443). De backend wordt
   intern bereikt — port-forward 8080 mag weg. Poort **80** blijft open (Let's
   Encrypt HTTP-01 + http→https-redirect).
2. **[DSM] Reverse proxy aanzetten** zodat `/api` werkt en de live data laadt:
   Web Station-vhost van alltrexx.live uit → Aanmeldingsportaal → Omgekeerde proxy:
   HTTPS `alltrexx.live` 443 → HTTP `localhost` 3000 (zie stap 3). Daarna geeft
   `https://alltrexx.live/api/kaart/live` JSON i.p.v. 404.
3. **[security] OpenAIP-key roteren** op openaip.net (de oude staat publiek in de
   JS-bundle). Nieuwe key in `frontend/.env` → opnieuw builden → uploaden (stap 4).
4. **[security] CloudKit naar productie**: `REACT_APP_CLOUDKIT_ENV=production` +
   een productie-token, en de security-roles in de CloudKit-dashboard nalopen.
5. **[backend] Container herbouwen** zodat de security-fix (CORS/H2/actuator) live
   gaat — Container Manager → project → opnieuw bouwen. Bron staat al klaar in
   `/volume1/Backup-Ed/alltrexx-nas/`.
6. _(optioneel)_ **DNS-01-challenge** via `acme.sh` als je ook poort 80 dicht wilt.

Klaar zijn we als: `https://alltrexx.live/api/kaart/live` JSON geeft, poort 8080
publiek dicht is, en de bundle geen geldige keys meer bevat.

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

## Poorten & certificaat — wat moet open?

| Poort | Publiek nodig? | Waarvoor |
|---|---|---|
| 80   | ja | Let's Encrypt HTTP-01-validatie + http→https-redirect |
| 443  | ja | de site/app zelf (HTTPS) |
| 8080 | **nee** | backend — alleen intern, port-forward mag dicht |
| 3000 | nee | frontend-container — alleen intern (reverse proxy → localhost:3000) |
| 3306 | nee | MySQL — alleen intern |

**Let's Encrypt gebruikt nooit 8080.** Synology valideert via HTTP-01 op poort 80.
Wil je ook 80 dicht: gebruik de DNS-01-challenge (acme.sh) i.p.v. DSM's certbeheer.

## Waar stond ook alweer wat?

| Plek | Inhoud |
|---|---|
| `/volume1/web/alltrexx-live/` | docroot van alltrexx.live — statische frontend-preview |
| `/volume1/Backup-Ed/alltrexx-nas/` | Docker-project voor Container Manager (privé) |
| `/volume1/Backup-Ed/alltrexx-live-wordpress-backup/` | oude WordPress die eerst in de webmap stond |
