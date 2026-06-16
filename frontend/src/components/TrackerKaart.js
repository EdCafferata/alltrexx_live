import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, LayerGroup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getLiveKaart, getRoute } from '../services/api';
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
    label: '⚓ Nautische zeekaart (OpenSeaMap)',
    url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openseamap.org">OpenSeaMap</a>',
  },
  fietsroutes: {
    label: '🚴 Fietsroutes (Waymarked Trails)',
    url: 'https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png',
    attribution: '© Waymarked Trails © OpenStreetMap',
  },
  wandelroutes: {
    label: '🥾 Wandelroutes (Waymarked Trails)',
    url: 'https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png',
    attribution: '© Waymarked Trails © OpenStreetMap',
  },
  spoorwegen: {
    label: '🚆 Spoorwegen (OpenRailwayMap)',
    url: 'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
    attribution: '© OpenRailwayMap © OpenStreetMap',
  },
  luchtvaart: {
    label: '✈️ Vliegvelden & luchtruim (OpenAIP)',
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

// Periodes voor het tonen van routes (de ronde om Noord-Holland duurt > 24u)
const ROUTE_PERIODES = [
  { uur: 24,  label: '1 dag' },
  { uur: 48,  label: '2 dagen' },
  { uur: 72,  label: '3 dagen' },
  { uur: 120, label: '5 dagen' },
  { uur: 168, label: '7 dagen' },
  { uur: 336, label: '14 dagen' },
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

export default function TrackerKaart() {
  const [posities, setPosities] = useState([]);
  const [geselecteerd, setGeselecteerd] = useState(null);
  const [route, setRoute] = useState([]);

  // Kaartopties
  const [preset, setPreset] = useState('standaard');
  const [overlaysAan, setOverlaysAan] = useState(
    Object.fromEntries(Object.keys(OVERLAYS).map(k => [k, false]))
  );
  const [lagenOpen, setLagenOpen] = useState(false);

  const kiesPreset = (key) => {
    setPreset(key);
    setOverlaysAan(Object.fromEntries(
      Object.keys(OVERLAYS).map(k => [k, KAART_PRESETS[key].overlays.includes(k)])
    ));
  };

  // Per type: zichtbaar + routes aan/uit
  const [typeOpties, setTypeOpties] = useState(() =>
    Object.fromEntries(Object.keys(ICOON_CONFIG).map(t => [t, { zichtbaar: true, routes: false }]))
  );
  const [typeRoutes, setTypeRoutes] = useState({}); // { trackerId: [[lat,lon],...] }
  const [openPaneel, setOpenPaneel] = useState(null); // welk FAB-menu open is
  const [zoomDoel, setZoomDoel] = useState(null);
  const [fabZoek, setFabZoek] = useState(''); // zoekterm in het open FAB-menu
  const [routeUur, setRouteUur] = useState(24); // route-periode in uren (24u … 14 dagen)

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

  // Route ophalen bij selectie van één tracker
  useEffect(() => {
    if (!geselecteerd) { setRoute([]); return; }
    getRoute(geselecteerd.trackerId, routeUur)
      .then(data => setRoute(data.map(p => [p.lat, p.lon])))
      .catch(console.error);
  }, [geselecteerd, routeUur]);

  // Routes per type ophalen wanneer ingeschakeld
  const positiesRef = useRef(posities);
  positiesRef.current = posities;
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
  }, [typeOpties, routeUur]);

  // Groepeer per type
  const perType = {};
  for (const type of Object.keys(ICOON_CONFIG)) {
    perType[type] = posities.filter(p => p.type === type);
  }

  const zetTypeOptie = (type, key, waarde) =>
    setTypeOpties(prev => ({ ...prev, [type]: { ...prev[type], [key]: waarde } }));

  const basis = BASIS_TILES[KAART_PRESETS[preset].basis];

  return (
    <div className="kaart-wrapper">
      <MapContainer center={[52.5, 5.0]} zoom={7} zoomControl={false}
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

        {/* Markers per type */}
        {Object.entries(ICOON_CONFIG).map(([type, cfg]) =>
          typeOpties[type].zichtbaar && (
            <LayerGroup key={type}>
              {perType[type].map(pos => (
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
                          : `📍 Route tonen (${ROUTE_PERIODES.find(p => p.uur === routeUur)?.label || routeUur + 'u'})`}
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
              {perType[type].map(pos => {
                const lijn = typeRoutes[pos.trackerId];
                return lijn && lijn.length > 1 && (
                  <Polyline key={pos.trackerId} positions={lijn}
                    color={cfg.kleur} weight={3} opacity={0.7} />
                );
              })}
            </LayerGroup>
          )
        )}

        {/* Route van geselecteerde tracker */}
        {route.length > 1 && (
          <Polyline
            positions={route}
            color={geselecteerd ? ICOON_CONFIG[geselecteerd.type]?.kleur : '#333'}
            weight={4} opacity={0.9}
          />
        )}
      </MapContainer>

      {/* ── Lagen-paneel (rechtsboven) ────────────────────────────────────── */}
      <button className="lagen-knop" onClick={() => setLagenOpen(!lagenOpen)}
        title="Kaartlagen">🗺️</button>

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
                title={ov.vergtKey ? 'API-key nodig — gratis aan te maken op openaip.net' : undefined}>
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
                  <select className="fab-routes-periode" value={routeUur}
                    onChange={e => setRouteUur(Number(e.target.value))}
                    title="Periode van de route — langer voor de ronde om Noord-Holland">
                    {ROUTE_PERIODES.map(p => (
                      <option key={p.uur} value={p.uur}>{p.label}</option>
                    ))}
                  </select>
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
                <div className="fab-menu-lijst">
                  {zichtbareTrackers.map(pos => (
                    <button key={pos.trackerId} className="fab-menu-tracker"
                      onClick={() => { setZoomDoel([[pos.lat, pos.lon]]); setGeselecteerd(pos); }}>
                      {pos.trackerNaam}
                      <span>{pos.snelheid.toFixed(0)} km/u</span>
                    </button>
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
