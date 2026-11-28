import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, LayerGroup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getLiveKaart, getRoute, getRouteTussen, meldTracker } from '../services/api';
import RoutePlayback from './RoutePlayback';
import './TrackerKaart.css';

// ── De vijf typen — zelfde vijf opties als in de mobile app (eerste-gebruik scherm) ──
// Volgorde = langzaamste boven, snelste onder (geldt ook voor de dock links)
export const ICOON_CONFIG = {
  PERSON: { emoji: '🚶', kleur: '#00695C', label: 'Personen'    },
  BIKE:   { emoji: '🚴', kleur: '#2E7D32', label: 'Fietsen'     },
  BOAT:   { emoji: '⛵', kleur: '#1565C0', label: 'Boten'       },
  CAR:    { emoji: '🚗', kleur: '#E65100', label: "Auto's"      },
  TRAIN:  { emoji: '🚆', kleur: '#C62828', label: 'Treinen'     },
  PLANE:  { emoji: '✈️', kleur: '#6A1B9A', label: 'Vliegtuigen' },
};

// ── Basiskaart-tiles ──────────────────────────────────────────────────────────
const BASIS_TILES = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://osm.org/copyright">OpenStreetMap</a>',
  },
  cyclosm: {
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution: '© CyclOSM © OpenStreetMap',
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap (CC-BY-SA)',
  },
  licht: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© CARTO © OpenStreetMap',
  },
};

// ── Overlays die over elke kaart heen kunnen ─────────────────────────────────
const OVERLAYS = {
  seamap: {
    label: '⚓ Nautische zeekaart',
    bron: 'Bron: OpenSeaMap',
    url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openseamap.org">OpenSeaMap</a>',
  },
  fietsroutes: {
    label: '🚴 Fietsroutes',
    bron: 'Bron: Waymarked Trails',
    url: 'https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png',
    attribution: '© Waymarked Trails © OpenStreetMap',
  },
  wandelroutes: {
    label: '🥾 Wandelroutes',
    bron: 'Bron: Waymarked Trails',
    url: 'https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png',
    attribution: '© Waymarked Trails © OpenStreetMap',
  },
  spoorwegen: {
    label: '🚆 Spoorwegen',
    bron: 'Bron: OpenRailwayMap',
    url: 'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
    attribution: '© OpenRailwayMap © OpenStreetMap',
  },
  luchtvaart: {
    label: '✈️ Vliegvelden & luchtruim',
    bron: 'Bron: OpenAIP',
    url: `https://api.tiles.openaip.net/api/data/openaip/{z}/{x}/{y}.png?apiKey=${process.env.REACT_APP_OPENAIP_KEY || ''}`,
    attribution: '© <a href="https://www.openaip.net">OpenAIP</a> (CC-BY-NC)',
    vergtKey: !process.env.REACT_APP_OPENAIP_KEY, // gratis key via openaip.net
  },
};

// ── Kaartpresets: Standaard + één kant-en-klare kaart per type ───────────────
const KAART_PRESETS = {
  standaard: { label: '🗺️ Standaard',    basis: 'osm',     overlays: [] },
  boot:      { label: '⛵ Boot kaart',    basis: 'osm',     overlays: ['seamap'] },
  fiets:     { label: '🚴 Fiets kaart',   basis: 'cyclosm', overlays: ['fietsroutes'] },
  auto:      { label: '🚗 Auto kaart',    basis: 'osm',     overlays: [] },
  vlieg:     { label: '✈️ Vlieg kaart',   basis: 'licht',
               overlays: process.env.REACT_APP_OPENAIP_KEY ? ['luchtvaart'] : [] },
  wandel:    { label: '🚶 Wandel kaart',  basis: 'topo',    overlays: ['wandelroutes'] },
  trein:     { label: '🚆 Trein kaart',   basis: 'licht',   overlays: ['spoorwegen'] },
};

function maakIcoon(type, koers = 0) {
  const cfg = ICOON_CONFIG[type] || ICOON_CONFIG.PERSON;
  const html = `
    <div class="tracker-icoon" style="transform: rotate(${koers}deg)">
      <span>${cfg.emoji}</span>
    </div>`;
  return L.divIcon({ html, className: '', iconSize: [36, 36], iconAnchor: [18, 18] });
}

const REFRESH_INTERVAL = 30_000; // 30 seconden

// Eenheden voor de route-periode: vrij getal × eenheid → uren (1 uur t/m jaren)
const ROUTE_EENHEDEN = [
  { uur: 1,    enkel: 'uur',   meer: 'uur' },
  { uur: 24,   enkel: 'dag',   meer: 'dagen' },
  { uur: 168,  enkel: 'week',  meer: 'weken' },
  { uur: 720,  enkel: 'maand', meer: 'maanden' },
  { uur: 8760, enkel: 'jaar',  meer: 'jaar' },
];

// Hulpcomponent: zoom naar posities van één type
function ZoomNaar({ doel }) {
  const map = useMap();
  useEffect(() => {
    if (doel && doel.length > 0) {
      map.fitBounds(L.latLngBounds(doel), { padding: [60, 60], maxZoom: 12 });
    }
  }, [doel, map]);
  return null;
}

// Hulpcomponent: houdt de huidige kaartweergave (center + zoom) bij
function ViewVolger({ onWijzig, onKlik }) {
  const map = useMapEvents({
    click: () => onKlik && onKlik(),
    moveend: () => { const c = map.getCenter(); onWijzig({ lat: c.lat, lon: c.lng, zoom: map.getZoom() }); },
    zoomend: () => { const c = map.getCenter(); onWijzig({ lat: c.lat, lon: c.lng, zoom: map.getZoom() }); },
  });
  return null;
}

// Hulpcomponent: springt naar de opgehaalde locatie van het toestel zodra die binnen is
function GaNaarEigenLocatie({ doel }) {
  const map = useMap();
  useEffect(() => {
    if (doel) map.setView([doel.lat, doel.lon], doel.zoom);
  }, [doel, map]);
  return null;
}

// Beginweergave bepalen: eerst uit de URL (?lat&lon&z&laag&types), anders een
// vastgehouden weergave uit localStorage, anders heel Nederland.
// Zeilwedstrijden: elke wedstrijd = boten uit de eigen tracker-app (Tracker.bron) + vaste uitsnede.
export const WEDSTRIJDEN = {
  rnh: {
    naam: 'Ronde om Noord-Holland', kort: 'RNH',
    tekst: 'Rond Noord-Holland: van IJmuiden via Den Helder over het IJsselmeer.',
    foto: 'race-rnh.png', app: 'https://apps.apple.com/nl/app/rnh-tracker/id1598986930',
    gebied: [[52.36, 4.45], [53.02, 5.45]], midden: [52.69, 4.95], zoom: 9,
  },
  bvk: {
    naam: 'Blocq van Kuffeler', kort: 'BVK',
    tekst: 'De Blocq van Kuffeler-zeilrace op het Markermeer, vanuit Almere.',
    foto: 'race-bvk.png', app: 'https://apps.apple.com/nl/app/bvk-tracker/id6770708440',
    gebied: [[52.30, 4.95], [52.62, 5.45]], midden: [52.46, 5.20], zoom: 10,
  },
};


function leesStartConfig() {
  const p = new URLSearchParams(window.location.search);
  // ?bron=rnh|bvk (of oud: ?rnh=1) → alleen boten uit die wedstrijd-app, zeekaart, eigen gebied
  const bron = p.get('rnh') === '1' ? 'rnh' : (p.get('bron') || '').toLowerCase();
  if (WEDSTRIJDEN[bron]) {
    const w = WEDSTRIJDEN[bron];
    return { lat: w.midden[0], lon: w.midden[1], zoom: w.zoom, preset: 'boot', types: ['BOAT'], wedstrijd: bron, pinned: false, geoZoeken: false };
  }
  // ?laag=<preset>&types=<TYPE> werkt ook zonder lat/lon (de app-live-kaart geeft die
  // mee op basis van het gekozen tracker-type: persoon → wandel, boot → boot, enz.).
  const urlPreset = p.get('laag');
  const urlTypes = p.get('types') ? p.get('types').split(',') : null;
  const lat = parseFloat(p.get('lat'));
  const lon = parseFloat(p.get('lon'));
  const z = parseInt(p.get('z'), 10);
  if (!isNaN(lat) && !isNaN(lon)) {
    return {
      lat, lon, zoom: !isNaN(z) ? z : 12,
      preset: urlPreset || 'boot',
      types: urlTypes,
      pinned: false,
      geoZoeken: false,
    };
  }
  try {
    const opg = JSON.parse(localStorage.getItem('alltrexx-view') || 'null');
    if (localStorage.getItem('alltrexx-view-pin') === '1' && opg) {
      return { lat: opg.lat, lon: opg.lon, zoom: opg.zoom, preset: urlPreset || 'boot', types: urlTypes, pinned: true, geoZoeken: false };
    }
  } catch { /* negeren */ }
  // Standaard-start: Boot-kaart, alleen boten zichtbaar + routes aan. Een ?laag/?types
  // (bijv. vanuit de app-live-kaart) overschrijft die standaard. Geen URL-link en geen
  // vastgehouden weergave → geoZoeken mag de locatie van het toestel ophalen, met heel
  // Nederland als terugval.
  return { lat: 52.5, lon: 5.0, zoom: 7, preset: urlPreset || 'boot', types: urlTypes, pinned: false, geoZoeken: true };
}

export default function TrackerKaart() {
  const [posities, setPosities] = useState([]);
  const [geselecteerd, setGeselecteerd] = useState(null);
  const [route, setRoute] = useState([]);
  // Route-playback ("tijdreis"): volledige posities + afspeelstatus van de selectie
  const [routeVol, setRouteVol] = useState([]);
  const [afIndex, setAfIndex] = useState(0);
  const [afSpelen, setAfSpelen] = useState(false);
  const [afSnelheid, setAfSnelheid] = useState(2);
  // Begin/eind-datum van de afgespeelde route (YYYY-MM-DD, lokaal)
  const [van, setVan] = useState('');
  const [tot, setTot] = useState('');

  // Beginweergave (URL / vastgehouden / standaard) — eenmalig bepalen
  const startRef = useRef(null);
  if (!startRef.current) startRef.current = leesStartConfig();
  const start = startRef.current;
  const startPreset = KAART_PRESETS[start.preset] ? start.preset : 'boot';

  // Kaartopties
  const [preset, setPreset] = useState(startPreset);
  const [overlaysAan, setOverlaysAan] = useState(
    Object.fromEntries(Object.keys(OVERLAYS).map(k => [k, KAART_PRESETS[startPreset].overlays.includes(k)]))
  );
  const [lagenOpen, setLagenOpen] = useState(false);

  // Huidige weergave + vasthouden/delen
  const [huidigeView, setHuidigeView] = useState({ lat: start.lat, lon: start.lon, zoom: start.zoom });
  const [vastgezet, setVastgezet] = useState(start.pinned);
  const [gedeeld, setGedeeld] = useState(false);

  // Eigen locatie ophalen als startpunt (telefoon/tablet/laptop) — alleen als er geen
  // deel-link of vastgehouden weergave is. Lukt het niet (geweigerd/timeout/geen
  // ondersteuning), dan blijft gewoon de standaard NL-weergave staan.
  const [eigenLocatie, setEigenLocatie] = useState(null);
  useEffect(() => {
    if (!start.geoZoeken || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setEigenLocatie({ lat: pos.coords.latitude, lon: pos.coords.longitude, zoom: 12 }),
      () => { /* geweigerd of mislukt: standaard NL-weergave blijft staan */ },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kiesPreset = (key) => {
    setPreset(key);
    setOverlaysAan(Object.fromEntries(
      Object.keys(OVERLAYS).map(k => [k, KAART_PRESETS[key].overlays.includes(k)])
    ));
  };

  // Per type: zichtbaar + routes aan/uit. Standaard (geen URL-types): alleen Boten
  // zichtbaar én hun route aan; een deel-link met types overschrijft dit.
  const [typeOpties, setTypeOpties] = useState(() =>
    Object.fromEntries(Object.keys(ICOON_CONFIG).map(t => [t, {
      zichtbaar: start.types ? start.types.includes(t) : (t === 'BOAT'),
      routes: start.types ? false : (t === 'BOAT'),
    }]))
  );
  // Per tracker een vinkje (#41): verborgen trackerId's. Nieuwe trackers staan standaard aan.
  const [verborgen, setVerborgen] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('alltrexx-verborgen') || '[]')); }
    catch { return new Set(); }
  });
  const zetVerborgen = (wijzig) => setVerborgen(prev => {
    const nieuw = new Set(prev);
    wijzig(nieuw);
    try { localStorage.setItem('alltrexx-verborgen', JSON.stringify([...nieuw])); } catch { /* geen opslag */ }
    return nieuw;
  });
  // Wedstrijd-modus: alleen trackers uit de gekozen wedstrijd-app (trackerBron === 'rnh'/'bvk')
  const [wedstrijd, setWedstrijd] = useState(start.wedstrijd || null);
  const [wedstrijdKiezer, setWedstrijdKiezer] = useState(false);
  const kiesWedstrijd = (bron) => {
    setWedstrijdKiezer(false);
    setWedstrijd(bron);
    if (!bron) return;
    kiesPreset('boot');
    setTypeOpties(prev => Object.fromEntries(Object.keys(prev).map(t => [t, {
      zichtbaar: t === 'BOAT', routes: t === 'BOAT' ? prev[t].routes : false,
    }])));
    setZoomDoel(WEDSTRIJDEN[bron].gebied);
  };
  const [typeRoutes, setTypeRoutes] = useState({}); // { trackerId: [[lat,lon],...] }
  const [gemeld, setGemeld] = useState({}); // { trackerId: 'confirm'|'bezig'|'ok'|'fout' }

  // Meld een aanstootgevende tracker-naam. Bevestiging + feedback gebeuren in de knop
  // zelf (geen window.confirm/alert — die tonen niets in de WKWebView van de app).
  // Eerste tik vraagt bevestiging, tweede tik verstuurt de melding.
  const meldNaam = async (pos) => {
    if (!pos || !pos.trackerId) return;
    const id = pos.trackerId;
    const stand = gemeld[id];
    if (stand === 'ok' || stand === 'bezig') return;
    if (stand !== 'confirm') { setGemeld(g => ({ ...g, [id]: 'confirm' })); return; }
    setGemeld(g => ({ ...g, [id]: 'bezig' }));
    try {
      await meldTracker(id);
      setGemeld(g => ({ ...g, [id]: 'ok' }));
    } catch (e) {
      setGemeld(g => ({ ...g, [id]: 'fout' }));
    }
  };
  const [openPaneel, setOpenPaneel] = useState(null); // welk FAB-menu open is
  const [zoomDoel, setZoomDoel] = useState(null);
  const [fabZoek, setFabZoek] = useState(''); // zoekterm in het open FAB-menu
  // Route-periode: vrij getal × eenheid (uur/dag/week/maand/jaar) → uren
  const [routeAantal, setRouteAantal] = useState(1);
  const [routeEenheidUur, setRouteEenheidUur] = useState(24); // standaard: dag
  const routeUur = Math.max(1, Math.round((Number(routeAantal) || 1) * routeEenheidUur));
  const routeEenheid = ROUTE_EENHEDEN.find(e => e.uur === routeEenheidUur) || ROUTE_EENHEDEN[1];
  const routeLabel = `${Number(routeAantal) || 1} ${(Number(routeAantal) || 1) === 1 ? routeEenheid.enkel : routeEenheid.meer}`;

  // Vastgehouden weergave bewaren/wissen in de browser
  useEffect(() => {
    if (vastgezet) {
      localStorage.setItem('alltrexx-view', JSON.stringify(huidigeView));
      localStorage.setItem('alltrexx-view-pin', '1');
    } else {
      localStorage.removeItem('alltrexx-view-pin');
    }
  }, [vastgezet, huidigeView]);

  // Deel-link bouwen (positie + zoom + kaartlaag + zichtbare types) en kopiëren
  const deelWeergave = () => {
    const zichtbaar = Object.keys(typeOpties).filter(t => typeOpties[t].zichtbaar);
    const p = new URLSearchParams();
    p.set('lat', huidigeView.lat.toFixed(5));
    p.set('lon', huidigeView.lon.toFixed(5));
    p.set('z', String(Math.round(huidigeView.zoom)));
    if (preset !== 'standaard') p.set('laag', preset);
    if (zichtbaar.length < Object.keys(typeOpties).length) p.set('types', zichtbaar.join(','));
    if (wedstrijd) {
      // Wedstrijd-weergave delen als vaste link (zelfde uitsnede voor iedereen)
      p.delete('lat'); p.delete('lon'); p.delete('z'); p.delete('laag'); p.delete('types');
      p.set('bron', wedstrijd);
    }
    const url = `${window.location.origin}${window.location.pathname}?${p.toString()}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => { setGedeeld(true); setTimeout(() => setGedeeld(false), 1800); })
        .catch(() => { /* clipboard niet beschikbaar */ });
    }
  };

  // Screensaver-intro: iconen zweven eerst over het scherm, daarna naar de dock
  const [intro, setIntro] = useState(true);
  useEffect(() => {
    if (!intro) return;
    const timer = setTimeout(() => setIntro(false), 20000);
    const stop = () => setIntro(false);
    window.addEventListener('pointerdown', stop);
    return () => { clearTimeout(timer); window.removeEventListener('pointerdown', stop); };
  }, [intro]);

  // Live posities ophalen
  useEffect(() => {
    const laad = () => getLiveKaart().then(setPosities).catch(console.error);
    laad();
    const interval = setInterval(laad, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Standaard-datumvenster instellen bij selectie (of opruimen bij deselectie).
  // De periode uit het type-menu (routeUur) bepaalt het beginvenster; de gebruiker
  // kan daarna begin/eind fijnregelen in de afspeelbalk.
  useEffect(() => {
    if (!geselecteerd) {
      setRoute([]); setRouteVol([]); setAfSpelen(false); setVan(''); setTot('');
      return;
    }
    const datumStr = (d) => {
      const z = new Date(d);
      z.setMinutes(z.getMinutes() - z.getTimezoneOffset());
      return z.toISOString().slice(0, 10);
    };
    const nu = new Date();
    setTot(datumStr(nu));
    setVan(datumStr(new Date(nu.getTime() - routeUur * 3600 * 1000)));
  }, [geselecteerd, routeUur]);

  // Route ophalen voor het gekozen datumvenster (begin/eind)
  useEffect(() => {
    if (!geselecteerd || !van || !tot) return;
    getRouteTussen(geselecteerd.trackerId, `${van}T00:00:00`, `${tot}T23:59:59`)
      .then(data => {
        setRoute(data.map(p => [p.lat, p.lon]));
        setRouteVol(data);
        setAfIndex(Math.max(0, data.length - 1));
        setAfSpelen(false);
      })
      .catch(console.error);
  }, [geselecteerd, van, tot]);

  // Afspeel-timer: schuif de index op zolang er wordt afgespeeld
  useEffect(() => {
    if (!afSpelen || routeVol.length < 2) return;
    const interval = Math.max(60, Math.round(500 / afSnelheid));
    const id = setInterval(() => {
      setAfIndex(i => {
        if (i >= routeVol.length - 1) { setAfSpelen(false); return i; }
        return i + 1;
      });
    }, interval);
    return () => clearInterval(id);
  }, [afSpelen, afSnelheid, routeVol]);

  // Start afspelen: bij het eind eerst terug naar het begin
  const startAfspelen = () => {
    setAfIndex(i => (i >= routeVol.length - 1 ? 0 : i));
    setAfSpelen(true);
  };

  // Routes per type ophalen wanneer ingeschakeld
  const getoond = wedstrijd ? posities.filter(p => p.trackerBron === wedstrijd) : posities;
  const positiesRef = useRef(getoond);
  positiesRef.current = getoond;
  useEffect(() => {
    const actieveTypes = Object.keys(typeOpties).filter(t => typeOpties[t].routes);
    if (actieveTypes.length === 0) { setTypeRoutes({}); return; }
    const trackers = positiesRef.current.filter(p => actieveTypes.includes(p.type));
    Promise.all(
      trackers.map(p =>
        getRoute(p.trackerId, routeUur)
          .then(data => [p.trackerId, data.map(q => [q.lat, q.lon])])
          .catch(() => [p.trackerId, []])
      )
    ).then(entries => setTypeRoutes(Object.fromEntries(entries)));
  }, [typeOpties, routeUur, wedstrijd]);

  // Groepeer per type (in wedstrijd-modus alleen de boten van die wedstrijd)
  const perType = {};
  for (const type of Object.keys(ICOON_CONFIG)) {
    perType[type] = getoond.filter(p => p.type === type);
  }

  const zetTypeOptie = (type, key, waarde) =>
    setTypeOpties(prev => ({ ...prev, [type]: { ...prev[type], [key]: waarde } }));

  const basis = BASIS_TILES[KAART_PRESETS[preset].basis];

  return (
    <div className="kaart-wrapper">
      <MapContainer center={[start.lat, start.lon]} zoom={start.zoom} zoomControl={false}
        style={{ height: '100%', width: '100%' }}>

        {/* Basiskaart volgens gekozen preset */}
        <TileLayer key={preset} url={basis.url} attribution={basis.attribution} />

        {/* Actieve overlays bovenop de basiskaart */}
        {Object.entries(OVERLAYS).map(([key, ov]) =>
          overlaysAan[key] && (
            <TileLayer key={`ov-${key}`} url={ov.url} attribution={ov.attribution} />
          )
        )}

        <ZoomNaar doel={zoomDoel} />
        <ViewVolger onWijzig={setHuidigeView}
          onKlik={() => { setLagenOpen(false); setOpenPaneel(null); setFabZoek(''); setAfSpelen(false); setGeselecteerd(null); }} />
        <GaNaarEigenLocatie doel={eigenLocatie} />

        {/* Markers per type */}
        {Object.entries(ICOON_CONFIG).map(([type, cfg]) =>
          typeOpties[type].zichtbaar && (
            <LayerGroup key={type}>
              {perType[type].filter(pos => !verborgen.has(pos.trackerId)).map(pos => (
                <Marker
                  key={pos.trackerId}
                  position={[pos.lat, pos.lon]}
                  icon={maakIcoon(type, pos.koers)}
                  eventHandlers={{ click: () => setGeselecteerd(pos) }}
                >
                  <Popup>
                    <div className="popup-inhoud">
                      <strong>{cfg.emoji} {pos.trackerNaam}</strong>
                      <div>🚀 {pos.snelheid.toFixed(1)} km/u</div>
                      <div>🧭 {pos.koers.toFixed(0)}°</div>
                      {pos.hoogte > 0 && <div>✈️ {pos.hoogte.toFixed(0)} m</div>}
                      <div className="popup-tijd">
                        {new Date(pos.tijdstip).toLocaleTimeString('nl-NL')}
                      </div>
                      <button
                        className="route-knop"
                        onClick={() => setGeselecteerd(
                          geselecteerd?.trackerId === pos.trackerId ? null : pos
                        )}
                      >
                        {geselecteerd?.trackerId === pos.trackerId
                          ? '✕ Route verbergen'
                          : `📍 Route tonen (${routeLabel})`}
                      </button>
                      <button
                        className="meld-knop"
                        title="Meld een aanstootgevende naam"
                        disabled={['ok', 'bezig'].includes(gemeld[pos.trackerId])}
                        onClick={() => meldNaam(pos)}
                      >
                        {gemeld[pos.trackerId] === 'confirm' ? '⚠️ Tik nogmaals om te melden'
                          : gemeld[pos.trackerId] === 'bezig' ? '… melden'
                          : gemeld[pos.trackerId] === 'ok' ? '✓ Gemeld — bedankt'
                          : gemeld[pos.trackerId] === 'fout' ? '⚠️ Mislukt — opnieuw'
                          : '⚠️ Naam melden'}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </LayerGroup>
          )
        )}

        {/* Routes per type */}
        {Object.entries(ICOON_CONFIG).map(([type, cfg]) =>
          typeOpties[type].routes && (
            <LayerGroup key={`route-${type}`}>
              {perType[type].filter(pos => !verborgen.has(pos.trackerId)).map(pos => {
                const lijn = typeRoutes[pos.trackerId];
                return lijn && lijn.length > 1 && (
                  <Polyline key={pos.trackerId} positions={lijn}
                    color={cfg.kleur} weight={3} opacity={0.7} />
                );
              })}
            </LayerGroup>
          )
        )}

        {/* Route van geselecteerde tracker — met afspeel-animatie ("tijdreis") */}
        {routeVol.length > 1 && geselecteerd && (() => {
          const kleur = ICOON_CONFIG[geselecteerd.type]?.kleur || '#333';
          const afgelegd = route.slice(0, afIndex + 1);
          const punt = routeVol[Math.min(afIndex, routeVol.length - 1)];
          return (
            <>
              {/* Volledige route vaag (waar 't nog heen gaat) */}
              <Polyline positions={route} color={kleur} weight={3} opacity={0.3} dashArray="6 8" />
              {/* Afgelegd deel fel */}
              {afgelegd.length > 1 && (
                <Polyline positions={afgelegd} color={kleur} weight={5} opacity={0.95} />
              )}
              {/* Bewegende marker op de huidige positie */}
              {punt && (
                <Marker
                  position={[punt.lat, punt.lon]}
                  icon={maakIcoon(geselecteerd.type, punt.koers)}
                  zIndexOffset={1000}
                />
              )}
            </>
          );
        })()}
      </MapContainer>

      {/* ── Route-playback balk ("tijdreis") ──────────────────────────────── */}
      {geselecteerd && (
        <RoutePlayback
          route={routeVol}
          naam={geselecteerd.trackerNaam}
          emoji={ICOON_CONFIG[geselecteerd.type]?.emoji || '📍'}
          index={afIndex}
          spelen={afSpelen}
          snelheid={afSnelheid}
          van={van}
          tot={tot}
          onSpeel={startAfspelen}
          onPauze={() => setAfSpelen(false)}
          onSeek={(i) => { setAfSpelen(false); setAfIndex(i); }}
          onSnelheid={setAfSnelheid}
          onPeriode={(v, t) => { setAfSpelen(false); if (v) setVan(v); if (t) setTot(t); }}
          onSluit={() => setGeselecteerd(null)}
        />
      )}

      {/* ── Logo linksboven ───────────────────────────────────────────────── */}
      <a className="kaart-logo" href="https://alltrexx.live" title="Alltrexx Live">
        <img src={`${process.env.PUBLIC_URL}/logo-alltrexx.png`} alt="Alltrexx Live" />
      </a>

      {/* ── Deel-/vasthoud-chip (linksonder) ──────────────────────────────── */}
      <div className={`deel-chip ${vastgezet ? 'deel-chip-vast' : ''}`}>
        <span className="deel-coord" title="Huidige weergave">
          📍 {huidigeView.lat.toFixed(4)}, {huidigeView.lon.toFixed(4)} · z{Math.round(huidigeView.zoom)}
        </span>
        <button className="deel-knop" onClick={() => setVastgezet(v => !v)}
          title="Deze weergave onthouden in deze browser">
          {vastgezet ? '📌 Vast' : '📌 Vasthouden'}
        </button>
        <button className="deel-knop" onClick={deelWeergave}
          title="Deel-link naar deze weergave kopiëren">
          {gedeeld ? '✓ Gekopieerd' : '🔗 Deel'}
        </button>
      </div>

      {/* ── Zeilwedstrijden (bovenaan midden) ─────────────────────────────── */}
      {wedstrijd ? (
        <div className="race-actief">
          <img src={`${process.env.PUBLIC_URL}/${WEDSTRIJDEN[wedstrijd].foto}`} alt="" />
          <span><b className="race-lang">{WEDSTRIJDEN[wedstrijd].naam}</b><b className="race-kort">{WEDSTRIJDEN[wedstrijd].kort}</b> · {perType.BOAT.length} {perType.BOAT.length === 1 ? 'boot' : 'boten'} live</span>
          <button onClick={() => setWedstrijdKiezer(true)} title="Andere wedstrijd kiezen">Wissel</button>
          <button onClick={() => kiesWedstrijd(null)} title="Alle trackers weer tonen" aria-label="Sluiten">✕</button>
        </div>
      ) : (
        <button className="race-knop" onClick={() => setWedstrijdKiezer(true)}>
          <span className="race-knop-foto" aria-hidden="true">⛵</span>
          <span className="race-knop-tekst"><b>Zeilwedstrijden</b><small>Volg de boten live</small></span>
        </button>
      )}

      {wedstrijdKiezer && (
        <div className="race-overlay" onClick={() => setWedstrijdKiezer(false)}>
          <div className="race-paneel" role="dialog" aria-label="Zeilwedstrijden" onClick={e => e.stopPropagation()}>
            <div className="race-hero">
              <svg viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <defs>
                  <linearGradient id="raceLucht" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7cc4f2"/><stop offset="1" stopColor="#d9efff"/></linearGradient>
                  <linearGradient id="raceZee" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f6fb2"/><stop offset="1" stopColor="#0b3a66"/></linearGradient>
                </defs>
                <rect width="400" height="140" fill="url(#raceLucht)"/>
                <circle cx="330" cy="34" r="16" fill="#fff4c2"/>
                <rect y="92" width="400" height="48" fill="url(#raceZee)"/>
                <g fill="#fff"><path d="M120 88 L120 30 L156 88Z"/><path d="M116 88 L116 42 L94 88Z" opacity=".85"/></g>
                <path d="M88 90 L162 90 L154 98 L96 98Z" fill="#0f1a2e"/>
                <g fill="#fff" transform="translate(190 8) scale(.7)"><path d="M120 88 L120 30 L156 88Z"/><path d="M116 88 L116 42 L94 88Z" opacity=".85"/><path d="M88 90 L162 90 L154 98 L96 98Z" fill="#0f1a2e"/></g>
                <g fill="#fff" transform="translate(40 40) scale(.45)"><path d="M120 88 L120 30 L156 88Z"/><path d="M88 90 L162 90 L154 98 L96 98Z" fill="#0f1a2e"/></g>
                <path d="M0 104 Q20 100 40 104 T80 104 T120 104 T160 104 T200 104 T240 104 T280 104 T320 104 T360 104 T400 104" stroke="#ffffff55" strokeWidth="2" fill="none"/>
              </svg>
              <button className="race-sluit" onClick={() => setWedstrijdKiezer(false)} aria-label="Sluiten">✕</button>
            </div>
            <div className="race-inhoud">
              <h2>Zeilwedstrijden live volgen</h2>
              <p>Deelnemers varen mee met de gratis tracker-app van hun wedstrijd. Kies een wedstrijd en zie alle boten live op de zeekaart.</p>
              <div className="race-opties">
                {Object.entries(WEDSTRIJDEN).map(([bron, w]) => (
                  <button key={bron} className={`race-optie ${wedstrijd === bron ? 'race-optie-aan' : ''}`} onClick={() => kiesWedstrijd(bron)}>
                    <img src={`${process.env.PUBLIC_URL}/${w.foto}`} alt="" />
                    <span><b>{w.naam}</b><small>{w.tekst}</small></span>
                  </button>
                ))}
              </div>
              <p className="race-voet">Zelf meevaren? Installeer de{' '}
                <a href={WEDSTRIJDEN.rnh.app} target="_blank" rel="noopener noreferrer">RNH Tracker</a> of de{' '}
                <a href={WEDSTRIJDEN.bvk.app} target="_blank" rel="noopener noreferrer">BVK Tracker</a> en zet in Voorkeuren Alltrexx.live aan.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Lagen-paneel (rechtsboven) ────────────────────────────────────── */}
      <button className="lagen-knop" onClick={() => setLagenOpen(!lagenOpen)}
        title="Kaartlagen" aria-label="Kaartlagen">
        {/* Kaart-icoon in Apple-stijl: afgeronde tegel met land, water, weg en speld */}
        <svg viewBox="0 0 64 64" className="lagen-icoon" aria-hidden="true">
          <defs>
            <clipPath id="lagenTegel"><rect width="64" height="64" rx="14" /></clipPath>
          </defs>
          <g clipPath="url(#lagenTegel)">
            <rect width="64" height="64" fill="#e8f1dc" />
            <path d="M0 40 C14 34 22 46 36 42 S56 30 64 34 V64 H0Z" fill="#9fd3f5" />
            <path d="M40 0 L44 0 L28 64 L24 64Z" fill="#f6c443" />
            <path d="M0 20 L64 14 L64 18 L0 24Z" fill="#ffffff" />
          </g>
          <path d="M40 12 a9 9 0 0 1 9 9 c0 7 -9 15 -9 15 s-9 -8 -9 -15 a9 9 0 0 1 9 -9z" fill="#ff3b30" />
          <circle cx="40" cy="21" r="3.4" fill="#fff" />
        </svg>
      </button>

      {lagenOpen && (
        <div className="lagen-paneel">
          {/* Bovendeel: kaartpresets — Standaard + één per type */}
          <div className="paneel-sectie">
            <div className="paneel-titel">Kaart</div>
            {Object.entries(KAART_PRESETS).map(([key, k]) => (
              <label key={key} className="paneel-rij">
                <input type="radio" name="kaartpreset" checked={preset === key}
                  onChange={() => kiesPreset(key)} />
                <span>{k.label}</span>
              </label>
            ))}
          </div>

          {/* Overlays: extra lagen over elke kaart heen (standaard uit) */}
          <div className="paneel-sectie">
            <div className="paneel-titel">Overlays</div>
            {Object.entries(OVERLAYS).map(([key, ov]) => (
              <label key={key} className={`paneel-rij ${ov.vergtKey ? 'paneel-rij-uit' : ''}`}
                title={ov.bron + (ov.vergtKey ? ' · API-key nodig (gratis op openaip.net)' : '')}>
                <input type="checkbox" checked={overlaysAan[key]} disabled={ov.vergtKey}
                  onChange={e => setOverlaysAan(prev => ({ ...prev, [key]: e.target.checked }))} />
                <span>{ov.label}{ov.vergtKey && ' 🔑'}</span>
              </label>
            ))}
          </div>

          {/* Onderdeel: de vijf typen met zichtbaar + routes */}
          <div className="paneel-sectie">
            <div className="paneel-titel">Trackers &amp; routes</div>
            {Object.entries(ICOON_CONFIG).map(([type, cfg]) => (
              <div key={type} className="paneel-type-rij">
                <label className="paneel-rij">
                  <input type="checkbox" checked={typeOpties[type].zichtbaar}
                    onChange={e => zetTypeOptie(type, 'zichtbaar', e.target.checked)} />
                  <span>{cfg.emoji} {cfg.label} ({perType[type].length})</span>
                </label>
                <label className="route-toggle" title={`Routes voor ${cfg.label.toLowerCase()}`}>
                  <input type="checkbox" checked={typeOpties[type].routes}
                    onChange={e => zetTypeOptie(type, 'routes', e.target.checked)} />
                  <span>📍</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Vijf floating knoppen — eerst screensaver, dan dock links ─────── */}
      <div className={`fab-kolom ${intro ? 'fab-screensaver' : ''}`}>
        {Object.entries(ICOON_CONFIG).map(([type, cfg], i) => {
          const fabTerm = fabZoek.trim().toLowerCase();
          const zichtbareTrackers = (openPaneel === type && fabTerm)
            ? perType[type].filter(p =>
                [p.trackerNaam, p.externeId]
                  .some(v => (v || '').toString().toLowerCase().includes(fabTerm)))
            : perType[type];
          return (
          <div key={type} className="fab-item" style={{ '--fab-index': i }}>
            <button
              className={`fab ${openPaneel === type ? 'fab-actief' : ''} ${!typeOpties[type].zichtbaar ? 'fab-uit' : ''}`}
              style={{ '--fab-kleur': cfg.kleur }}
              onClick={() => { setOpenPaneel(openPaneel === type ? null : type); setFabZoek(''); }}
              title={cfg.label}
            >
              {cfg.emoji}
              <span className="fab-teller">{perType[type].length}</span>
            </button>

            {openPaneel === type && (
              <div className="fab-menu" style={{ '--fab-kleur': cfg.kleur }}>
                <div className="fab-menu-titel">{cfg.emoji} {cfg.label}</div>
                <label className="paneel-rij">
                  <input type="checkbox" checked={typeOpties[type].zichtbaar}
                    onChange={e => zetTypeOptie(type, 'zichtbaar', e.target.checked)} />
                  <span>Tonen op kaart</span>
                </label>
                <div className="paneel-rij fab-routes-rij">
                  <label className="fab-routes-label">
                    <input type="checkbox" checked={typeOpties[type].routes}
                      onChange={e => zetTypeOptie(type, 'routes', e.target.checked)} />
                    <span>Routes</span>
                  </label>
                  <div className="fab-routes-periode"
                    title="Periode van de route — vrij in te stellen (1 uur t/m jaren)">
                    <input type="number" min="1" className="fab-routes-getal"
                      value={routeAantal}
                      onChange={e => setRouteAantal(
                        e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1))} />
                    <select className="fab-routes-eenheid" value={routeEenheidUur}
                      onChange={e => setRouteEenheidUur(Number(e.target.value))}>
                      {ROUTE_EENHEDEN.map(eh => (
                        <option key={eh.uur} value={eh.uur}>{eh.meer}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button className="fab-menu-knop"
                  onClick={() => setZoomDoel(perType[type].map(p => [p.lat, p.lon]))}
                  disabled={perType[type].length === 0}>
                  🔍 Zoom naar {cfg.label.toLowerCase()}
                </button>
                {perType[type].length > 0 && (
                  <input className="fab-menu-zoek" type="search"
                    placeholder={`🔎 Zoek ${cfg.label.toLowerCase()} of MMSI…`}
                    value={fabZoek} onChange={e => setFabZoek(e.target.value)} />
                )}
                {zichtbareTrackers.length > 0 && (
                  <div className="fab-selectie-knoppen">
                    <button onClick={() => zetVerborgen(s => zichtbareTrackers.forEach(p => s.delete(p.trackerId)))}>
                      ☑︎ Alle
                    </button>
                    <button onClick={() => zetVerborgen(s => zichtbareTrackers.forEach(p => s.add(p.trackerId)))}>
                      ☐ Wissen
                    </button>
                  </div>
                )}
                <div className="fab-menu-lijst">
                  {zichtbareTrackers.map(pos => (
                    <div key={pos.trackerId} className="fab-menu-rij">
                      <input type="checkbox" checked={!verborgen.has(pos.trackerId)}
                        aria-label={`${pos.trackerNaam} tonen`}
                        onChange={e => zetVerborgen(s => e.target.checked
                          ? s.delete(pos.trackerId) : s.add(pos.trackerId))} />
                      <button className="fab-menu-tracker"
                        onClick={() => { setZoomDoel([[pos.lat, pos.lon]]); setGeselecteerd(pos); }}>
                        {pos.trackerNaam}
                        <span>{pos.snelheid.toFixed(0)} km/u</span>
                      </button>
                    </div>
                  ))}
                  {perType[type].length === 0 && (
                    <div className="fab-menu-leeg">Geen actieve trackers</div>
                  )}
                  {perType[type].length > 0 && zichtbareTrackers.length === 0 && (
                    <div className="fab-menu-leeg">Geen resultaten</div>
                  )}
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>

      {/* Status balk */}
      <div className="status-balk">
        {Object.entries(ICOON_CONFIG).map(([type, cfg]) => (
          <span key={type} className="status-item">
            {cfg.emoji} {perType[type].length}
          </span>
        ))}
        <span className="status-refresh">↻ live</span>
      </div>
    </div>
  );
}
