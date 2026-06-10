# Alltrexx Live — Ontwerpkeuzes & opties

Logboek van alle ontwerp- en techniekkeuzes, ook de keuzes die je niet direct in de UI ziet.
Laatst bijgewerkt: 10 juni 2026.

## Visie

De mooiste kaart waarop iedereen alle info kan laden én openen, zodat straks alle
apparaten gekoppeld kunnen worden. De **alltrexx_mobile** app wordt een kopie van de
BVK/RHN GPX Tracker-opzet, met bij het eerste gebruik een keuzescherm met **dezelfde
vijf opties** als op de site.

## De vijf typen (kern van alles)

| Type | Emoji | Kleur | Label |
|---|---|---|---|
| BOAT | ⛵ | `#1565C0` | Boten |
| BIKE | 🚴 | `#2E7D32` | Fietsen |
| CAR | 🚗 | `#E65100` | Auto's |
| PLANE | ✈️ | `#6A1B9A` | Vliegtuigen |
| PERSON | 🚶 | `#00695C` | Personen |

Deze vijf komen overal terug: de floating knoppen, het lagen-paneel, de statusbalk,
en straks het eerste-gebruik scherm van de mobile app. `ICOON_CONFIG` in
`frontend/src/components/TrackerKaart.js` is de bron; hij wordt geëxporteerd zodat
andere schermen hem kunnen hergebruiken.

## Lagen-paneel (🗺️ rechtsboven)

Eigen paneel in plaats van de standaard Leaflet `LayersControl` — meer controle en mooier.

**Bovendeel — basiskaarten (radio, één actief):**
- Standaard (OpenStreetMap)
- Topografisch (OpenTopoMap)
- Satelliet (Esri World Imagery)
- Licht (CARTO light_all)
- Donker (CARTO dark_all)

**Bovendeel — aparte toggle:** ⚓ Nautische zeekaart (OpenSeaMap seamark-tiles).
Bewust **uit de basiskaartlijst gehaald**: het is een transparante overlay die over
élke basiskaart heen kan (bijv. satelliet + zeekaart). Standaard AAN.
De oude dubbele "OpenStreetMap Nautisch"-basislaag (zelfde tiles als gewone OSM) is verwijderd.

**Onderdeel — per type twee schakelaars:**
- Zichtbaar-vinkje (markers tonen/verbergen) — standaard AAN
- 📍 Route-toggle (24u-routes van álle trackers van dat type) — standaard UIT

Zo kun je bijv. alleen routes voor fietsers of alleen voor vliegtuigen tonen.

## Vijf floating knoppen (links, verticaal gecentreerd)

Eén glazen knop per type, met teller-badge (aantal actieve trackers). Klik opent
een menu met:
- Tonen op kaart (zelfde state als lagen-paneel — bewust gedeeld)
- Routes (24u) voor het hele type
- 🔍 Zoom naar alle trackers van het type (`fitBounds`, maxZoom 12, padding 60px)
- Lijst van actieve trackers met snelheid; klik = inzoomen + selecteren

Een type dat onzichtbaar staat wordt grijs/transparant weergegeven (`fab-uit`).

## Liquid Glass-stijl (Apple, iOS 26)

Alle UI-elementen (FAB's, panelen, statusbalk, logo): frosted glas met
`backdrop-filter: blur(20-26px) saturate(180%)`, lichte 1px witte rand,
inset-highlight bovenaan (specular), zachte drop-shadow. FAB's hebben een
radial-gradient highlight linksboven (glasbol-effect) en een gekleurde glow-ring
per type via `color-mix(... var(--fab-kleur) ...)`.

## Screensaver-intro

Bij het laden zweven de vijf iconen over het **hele scherm** (als screensaver),
daarna landen ze met een veer-effect in de dock links.

Niet direct zichtbare keuzes:
- **Duur: 20 seconden**, óf eerder bij een klik/tik ergens (`pointerdown` op window)
- **Snelheid per type, realistisch:** vliegtuig 28s, auto 45s, boot 60s,
  fiets 90s (bewust veel trager), voetganger 120s per baan
- Elk type heeft een **eigen zweefbaan** (5 aparte keyframe-paden) zodat ze elkaar kruisen
- Dobber-effect (deinen/kantelen) schaalt mee: rondetijd ÷ 12
- Negatieve `animation-delay` zodat ze niet allemaal op hetzelfde punt starten
- Tijdens de intro: `pointer-events: none` (kaart blijft bedienbaar) en FAB-menu's verborgen
- `prefers-reduced-motion: reduce` → animaties uit (toegankelijkheid)
- Landing in de dock: gespreid per icoon (0,07s vertraging per stuk), bouncy
  cubic-bezier(0.34, 1.4, 0.64, 1)

## Layout & app-shell

- Bovenbalk (blauw, met nav Kaart/Routes/Trackers) **verwijderd** — kaart is 100vh
- Alleen een klein glazen "⚓ Alltrexx"-logo linksboven (z-index 1002)
- Alle navigatie/opties komen in de icons of onder het lagen-paneel
- Leaflet `zoomControl` uit (eigen schone UI)
- Statusbalk onderaan gecentreerd: teller per type + "↻ live" knipperend

## Data & gedrag (onzichtbare keuzes)

- Live posities: `GET /api/kaart/live`, elke **30 seconden** ververst
- Routes: `GET /api/.../route` over de laatste **24 uur**
- Type-routes worden parallel opgehaald (Promise.all); een mislukte route geeft
  stilletjes een lege lijn (catch → []), de rest tekent gewoon
- Route-kleur = de typekleur; geselecteerde-tracker-route is dikker (weight 4 vs 3)
- Popup per tracker: naam, snelheid, koers, hoogte (alleen indien > 0), tijdstip,
  route-knop
- Demo: 9 demo-trackers via `DemoDataLoader` (alleen dev-modus)

## Repo-fixes (10 juni 2026)

- `public/index.html` en `src/index.js` ontbraken in de repo — toegevoegd
  (index.js met `QueryClientProvider` voor @tanstack/react-query)
- Corrupte `package-lock.json` ("Invalid Version") vervangen door verse lockfile

## Nog te doen

- [ ] alltrexx_mobile: eerste-gebruik scherm met dezelfde vijf type-opties
- [ ] Apparaten koppelen (registratie/koppel-flow voor trackers)
- [ ] Routes/Trackers-functies (oude nav-links) terugbrengen in icons of lagen-paneel
