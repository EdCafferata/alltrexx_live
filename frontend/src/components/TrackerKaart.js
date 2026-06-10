import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, LayerGroup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getLiveKaart, getRoute } from '../services/api';
import './TrackerKaart.css';

// ── De vijf typen — zelfde vijf opties als in de mobile app (eerste-gebruik scherm) ──
export const ICOON_CONFIG = {
  BOAT:   { emoji: '⛵', kleur: '#1565C0', label: 'Boten'       },
  BIKE:   { emoji: '🚴', kleur: '#2E7D32', label: 'Fietsen'     },
  CAR:    { emoji: '🚗', kleur: '#E65100', label: "Auto's"      },
  PLANE:  { emoji: '✈️', kleur: '#6A1B9A', label: 'Vliegtuigen' },
  PERSON: { emoji: '🚶', kleur: '#00695C', label: 'Personen'    },
};

// ── Basiskaarten ──────────────────────────────────────────────────────────────
const BASISKAARTEN = {
  osm: {
    label: 'Standaard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://osm.org/copyright">OpenStreetMap</a>',
  },
  topo: {
    label: 'Topografisch',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap (CC-BY-SA)',
  },
  sat: {
    label: 'Satelliet',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri World Imagery',
  },
  licht: {
    label: 'Licht',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© CARTO © OpenStreetMap',
  },
  donker: {
    label: 'Donker',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© CARTO © OpenStreetMap',
  },
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
  const [basisKaart, setBasisKaart] = useState('osm');
  const [seamapAan, setSeamapAan] = useState(true);
  const [lagenOpen, setLagenOpen] = useState(false);

  // Per type: zichtbaar + routes aan/uit
  const [typeOpties, setTypeOpties] = useState(() =>
    Object.fromEntries(Object.keys(ICOON_CONFIG).map(t => [t, { zichtbaar: true, routes: false }]))
  );
  const [typeRoutes, setTypeRoutes] = useState({}); // { trackerId: [[lat,lon],...] }
  const [openPaneel, setOpenPaneel] = useState(null); // welk FAB-menu open is
  const [zoomDoel, setZoomDoel] = useState(null);

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
    getRoute(geselecteerd.trackerId, 24)
      .then(data => setRoute(data.map(p => [p.lat, p.lon])))
      .catch(console.error);
  }, [geselecteerd]);

  // Routes per type ophalen wanneer ingeschakeld
  const positiesRef = useRef(posities);
  positiesRef.current = posities;
  useEffect(() => {
    const actieveTypes = Object.keys(typeOpties).filter(t => typeOpties[t].routes);
    if (actieveTypes.length === 0) { setTypeRoutes({}); return; }
    const trackers = positiesRef.current.filter(p => actieveTypes.includes(p.type));
    Promise.all(
      trackers.map(p =>
        getRoute(p.trackerId, 24)
          .then(data => [p.trackerId, data.map(q => [q.lat, q.lon])])
          .catch(() => [p.trackerId, []])
      )
    ).then(entries => setTypeRoutes(Object.fromEntries(entries)));
  }, [typeOpties]);

  // Groepeer per type
  const perType = {};
  for (const type of Object.keys(ICOON_CONFIG)) {
    perType[type] = posities.filter(p => p.type === type);
  }

  const zetTypeOptie = (type, key, waarde) =>
    setTypeOpties(prev => ({ ...prev, [type]: { ...prev[type], [key]: waarde } }));

  const basis = BASISKAARTEN[basisKaart];

  return (
    <div className="kaart-wrapper">
      <MapContainer center={[52.5, 5.0]} zoom={7} zoomControl={false}
        style={{ height: '100%', width: '100%' }}>

        {/* Basiskaart */}
        <TileLayer key={basisKaart} url={basis.url} attribution={basis.attribution} />

        {/* Nautische zeekaart als overlay bovenop de basiskaart */}
        {seamapAan && (
          <TileLayer
            url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openseamap.org">OpenSeaMap</a>'
          />
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
                          : '📍 Route tonen (24u)'}
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
          {/* Bovendeel: basiskaarten + nautische zeekaart */}
          <div className="paneel-sectie">
            <div className="paneel-titel">Basiskaart</div>
            {Object.entries(BASISKAARTEN).map(([key, k]) => (
              <label key={key} className="paneel-rij">
                <input type="radio" name="basiskaart" checked={basisKaart === key}
                  onChange={() => setBasisKaart(key)} />
                <span>{k.label}</span>
              </label>
            ))}
            <label className="paneel-rij seamap-rij">
              <input type="checkbox" checked={seamapAan}
                onChange={e => setSeamapAan(e.target.checked)} />
              <span>⚓ Nautische zeekaart (OpenSeaMap)</span>
            </label>
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
        {Object.entries(ICOON_CONFIG).map(([type, cfg], i) => (
          <div key={type} className="fab-item" style={{ '--fab-index': i }}>
            <button
              className={`fab ${openPaneel === type ? 'fab-actief' : ''} ${!typeOpties[type].zichtbaar ? 'fab-uit' : ''}`}
              style={{ '--fab-kleur': cfg.kleur }}
              onClick={() => setOpenPaneel(openPaneel === type ? null : type)}
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
                <label className="paneel-rij">
                  <input type="checkbox" checked={typeOpties[type].routes}
                    onChange={e => zetTypeOptie(type, 'routes', e.target.checked)} />
                  <span>Routes (24u)</span>
                </label>
                <button className="fab-menu-knop"
                  onClick={() => setZoomDoel(perType[type].map(p => [p.lat, p.lon]))}
                  disabled={perType[type].length === 0}>
                  🔍 Zoom naar {cfg.label.toLowerCase()}
                </button>
                <div className="fab-menu-lijst">
                  {perType[type].map(pos => (
                    <button key={pos.trackerId} className="fab-menu-tracker"
                      onClick={() => { setZoomDoel([[pos.lat, pos.lon]]); setGeselecteerd(pos); }}>
                      {pos.trackerNaam}
                      <span>{pos.snelheid.toFixed(0)} km/u</span>
                    </button>
                  ))}
                  {perType[type].length === 0 && (
                    <div className="fab-menu-leeg">Geen actieve trackers</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
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
