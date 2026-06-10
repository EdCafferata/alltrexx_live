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
| TRAIN | 🚆 | `#C62828` | Treinen (toegevoegd 10 juni 2026 — "de vijf" zijn er nu zes) |

Deze vijf komen overal terug: de floating knoppen, het lagen-paneel, de statusbalk,
en straks het eerste-gebruik scherm van de mobile app. `ICOON_CONFIG` in
`frontend/src/components/TrackerKaart.js` is de bron; hij wordt geëxporteerd zodat
andere schermen hem kunnen hergebruiken.

## Lagen-paneel (🗺️ rechtsboven)

Eigen paneel in plaats van de standaard Leaflet `LayersControl` — meer controle en mooier.

**Bovendeel — kaartpresets (radio, één actief):** Standaard + één kant-en-klare
kaart per type. Een preset kiest een basiskaart én zet automatisch de passende
overlays aan:

| Preset | Basiskaart | Overlay automatisch aan |
|---|---|---|
| 🗺️ Standaard | OpenStreetMap | — |
| ⛵ Boot kaart | OpenStreetMap | Nautische zeekaart (OpenSeaMap) |
| 🚴 Fiets kaart | CyclOSM | Fietsroutes (Waymarked Trails) |
| 🚗 Auto kaart | OpenStreetMap | — (later: verkeer) |
| ✈️ Vlieg kaart | CARTO Licht (rustig voor vluchten) | — (later: OpenAIP luchtvaartkaart, vergt API-key) |
| 🚶 Wandel kaart | OpenTopoMap | Wandelroutes (Waymarked Trails) |
| 🚆 Trein kaart | CARTO Licht | Spoorwegen (OpenRailwayMap) |

**Overlays-sectie (alles standaard UIT):** hier staan álle beschikbare overlays
die je los over elke kaart kan leggen — ook handmatig combineerbaar
(bijv. Auto kaart + zeekaart):
- ⚓ Nautische zeekaart (OpenSeaMap) — bewust **niet actief** standaard
- 🚴 Fietsroutes (Waymarked Trails cycling)
- 🥾 Wandelroutes (Waymarked Trails hiking)
- 🚆 Spoorwegen (OpenRailwayMap standard)
- ✈️ Vliegvelden & luchtruim (OpenAIP, CC-BY-NC) — vergt gratis API-key
  (`REACT_APP_OPENAIP_KEY`, aanmaken op www.openaip.net). Zonder key staat de
  optie grijs met 🔑; mét key wordt hij ook automatisch onderdeel van de
  Vlieg kaart-preset.

De oude generieke basiskaartlijst (Topografisch/Satelliet/Licht/Donker als losse
keuzes) is vervangen door deze presets; de tiles zelf bestaan nog in `BASIS_TILES`
en kunnen later weer als optie terugkomen.

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
  fiets 90s (bewust veel trager), voetganger 120s, trein 35s per baan
  (treinbaan is bewust rechter, als over spoorlijnen)
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

## Account & CloudKit (privacy-by-design)

**Kernkeuze: de site/server slaat géén accounts of gevoelige data op.** Alles
(identiteit én trackdata van alle 5 typen) staat in **Apple CloudKit**.

- Logo-knop linksboven = account-menu: inloggen/registreren met Apple ID
  (registratie gebeurt automatisch bij eerste login via CloudKit)
- CloudKit JS via `frontend/src/services/cloudkit.js`; configuratie via `.env`:
  `REACT_APP_CLOUDKIT_CONTAINER`, `REACT_APP_CLOUDKIT_API_TOKEN` (aanmaken in
  CloudKit Dashboard → API Access), `REACT_APP_CLOUDKIT_ENV`
- Trackdata: recordtype `Track` (trackerId, type, punten, opgeslagen) in de
  **private database** van de gebruiker; beheer-zoekopdrachten op de publieke DB
- Toestemmingskeuzes (AVG) worden alleen **lokaal** bewaard (localStorage), niet
  op een server — er ís geen server met persoonsgegevens

**AVG / GDPR in de login-flow:**
- Verplicht vinkje: akkoord privacyverklaring + noodzakelijke verwerking (art. 6 lid 1a/1b)
- Optioneel vinkje: anonieme statistieken
- Inklapbare privacyverklaring met: wat/waar/grondslag/bewaartermijn, alle
  rechten (inzage, rectificatie, vergetelheid, beperking, portabiliteit, bezwaar,
  art. 15–21), EU-VS Data Privacy Framework, klachtrecht bij de Autoriteit
  Persoonsgegevens, en intrekken van toestemming
- Inloggen kan pas ná het verplichte vinkje

**Beheerder:** logt `edcafferata@icloud.com` in, dan verschijnt bovenin een
blauwe glazen beheersbalk met: 🔍 Data zoeken, ✏️ Gegevens aanpassen,
📊 Rapportages, 👥 Gebruikers, ⚙️ Instellingen (knoppen zijn nu nog placeholders;
functies volgen op CloudKit-queries). Check: e-mail uit de CloudKit-identiteit
== `BEHEERDER_EMAIL` in `cloudkit.js`.

**Let op (onzichtbare keuze):** CloudKit geeft het e-mailadres alleen mee als de
gebruiker via e-mail vindbaar is (`lookupInfo`).

**Status: werkend sinds 10 juni 2026.** Container `iCloud.cafferata.info.alltrexx`,
API-token geconfigureerd via `frontend/.env` (zie `frontend/.env.example`; echte
`.env` staat in .gitignore en komt nooit op GitHub).

**Lessen uit het configureren (10 juni 2026):**
- CloudKit JS rendert zijn **eigen** Apple-inlogknop in `<div id="apple-sign-in-button">`;
  een eigen knop die `whenUserSignsIn()` aanroept blijft eeuwig wachten. De div
  verschijnt zodra het verplichte AVG-vinkje aan staat.
- Token-type moet **API Token** zijn (géén Server-to-Server key) met
  **Sign in Callback** ingesteld op de site-URL (lokaal: http://localhost:3000).
- React leest alleen `frontend/.env` met `REACT_APP_`-prefix — en pas na een
  herstart van `npm start`.

## Repo-fixes (10 juni 2026)

- `public/index.html` en `src/index.js` ontbraken in de repo — toegevoegd
  (index.js met `QueryClientProvider` voor @tanstack/react-query)
- Corrupte `package-lock.json` ("Invalid Version") vervangen door verse lockfile

## Nog te doen

- [ ] alltrexx_mobile: eerste-gebruik scherm met dezelfde vijf type-opties
- [ ] Apparaten koppelen (registratie/koppel-flow voor trackers)
- [ ] Routes/Trackers-functies (oude nav-links) terugbrengen in icons of lagen-paneel
