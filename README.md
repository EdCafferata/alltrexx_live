# Alltrexx Live

🔒 Laatste security check: 2026-07-07 21:17 CEST

Realtime tracking-platform — live kaart op **https://alltrexx.live** voor boten ⛵,
fietsen 🚴, auto's 🚗, vliegtuigen ✈️, personen 🚶 en treinen 🚆.

## Wat het doet
- **Live kaart** (Leaflet) met per-type knoppen, zoeken, routes met instelbare periode,
  en een deelbare/vast-te-houden weergave (`?lat&lon&z&laag&types`).
- **Databronnen per type** (elke 15 min): AIS via **AISHub** (boten, op MMSI), ADS-B via
  **airplanes.live** (vliegtuigen, op ICAO-hex), en de **mobiele app** (op toestel-token).
- **Accounts (Free/Pro)**: login via Apple/CloudKit. **Free** = eigen voertuig & data +
  📖 logboek (type + periode dag/week/maand/alles); **Pro** = alle beheer-/kijk-opties.
  Gratis inlogsleutel (token) aan te maken voor de mobiele app.
- **Beheer** (Pro): trackers van elk type toevoegen/bewerken/wissen, registratie→ICAO-hex
  opzoeken (hexdb.io), token per toestel, en 👥 gebruikers (Pro-vlag) beheren.
- **Privacy**: trackdata blijft in Apple CloudKit. De server bewaart per gebruiker alleen een
  anoniem account-ID, een naam-label en de abonnementsstatus (FREE/PRO) — geen e-mail of trackdata.

## Stack
Spring Boot 3.2 · Java 21 · MySQL 8 · React 18 · Leaflet · Docker (Synology Container Manager).

## Eigenaar
- **Ed Cafferata** (edcafferata@icloud.com) · The IT Crowd

## Documentatie
- `CLAUDE.md` — projectcontext, structuur, endpoints, deploy-samenvatting
- `ONTWERP_KEUZES.md` — alle ontwerp- en techniekkeuzes (incl. sessie 15–17 juni 2026)
- `DEPLOY_NAS.md` — deploy op de Synology NAS
- `BOUW_HANDLEIDING.md` — bouwen & omgevingsvariabelen
- `data/BACKUP.md` — backup & herstel

## Sessie start / einde
1. `git pull origin main` · lees `CLAUDE.md`
2. einde: `git add -A && git commit && git push` · werk `CLAUDE.md` + `ONTWERP_KEUZES.md` bij

## GitHub
https://github.com/EdCafferata/alltrexx_live — branch `main`
