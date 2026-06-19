# Alltrexx Live

Realtime tracking-platform — live kaart op **https://alltrexx.live** voor boten ⛵,
fietsen 🚴, auto's 🚗, vliegtuigen ✈️, personen 🚶 en treinen 🚆.

## Wat het doet
- **Live kaart** (Leaflet) met per-type knoppen, zoeken, routes met instelbare periode,
  en een deelbare/vast-te-houden weergave (`?lat&lon&z&laag&types`).
- **Databronnen per type** (elke 15 min): AIS via **AISHub** (boten, op MMSI), ADS-B via
  **airplanes.live** (vliegtuigen, op ICAO-hex), en de **mobiele app** (op toestel-token).
- **Beheer** ("🛰️ Alle data beheren"): trackers van elk type toevoegen/bewerken/wissen,
  registratie→ICAO-hex opzoeken (hexdb.io), token per toestel.
- **Privacy**: login via Apple/CloudKit; geen persoonsgegevens op de server.

## Stack
Spring Boot 3.2 · Java 21 · MySQL 8 · React 18 · Leaflet · Docker (Synology Container Manager).

## Eigenaar
- **Ed Cafferata** (edcafferata@icloud.com) · mede-eigenaar **Jim Orie** · The IT Crowd

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
