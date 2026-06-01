import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, LayersControl, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getLiveKaart, getRoute } from '../services/api';
import './TrackerKaart.css';

const { BaseLayer, Overlay } = LayersControl;

// ── Iconen per tracker type ───────────────────────────────────────────────────
const ICOON_CONFIG = {
  BOAT:   { emoji: '⛵', kleur: '#1565C0', label: 'Boten'     },
  BIKE:   { emoji: '🚴', kleur: '#2E7D32', label: 'Fietsen'   },
  CAR:    { emoji: '🚗', kleur: '#E65100', label: "Auto's"    },
  PLANE:  { emoji: '✈️', kleur: '#6A1B9A', label: 'Vliegtuigen' },
  PERSON: { emoji: '🚶', kleur: '#00695C', label: 'Personen'  },
};

function maakIcoon(type, koers = 0) {
  const cfg = ICOON_CONFIG[type] || ICOON_CONFIG.PERSON;
  const html = `
    <div class="tracker-icoon" style="transform: rotate(${koers}deg)">
      <span>${cfg.emoji}</span>
    </div>`;
  return L.divIcon({ html, className: '', iconSize: [36, 36], iconAnchor: [18, 18] });
}

// ── Live bijwerken ────────────────────────────────────────────────────────────
const REFRESH_INTERVAL = 30_000; // 30 seconden

export default function TrackerKaart() {
  const [posities, setPosities] = useState([]);
  const [geselecteerd, setGeselecteerd] = useState(null);
  const [route, setRoute] = useState([]);

  // Live posities ophalen
  useEffect(() => {
    const laad = () => getLiveKaart().then(setPosities).catch(console.error);
    laad();
    const interval = setInterval(laad, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Route ophalen bij selectie
  useEffect(() => {
    if (!geselecteerd) { setRoute([]); return; }
    getRoute(geselecteerd.trackerId, 24)
      .then(data => setRoute(data.map(p => [p.lat, p.lon])))
      .catch(console.error);
  }, [geselecteerd]);

  // Groepeer per type
  const perType = {};
  for (const type of Object.keys(ICOON_CONFIG)) {
    perType[type] = posities.filter(p => p.type === type);
  }

  return (
    <div className="kaart-wrapper">
      <MapContainer
        center={[52.5, 5.0]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
      >
        <LayersControl position="topright">
          {/* Basis kaartlagen */}
          <BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://osm.org/copyright">OpenStreetMap</a>'
            />
          </BaseLayer>

          <BaseLayer name="OpenStreetMap Nautisch">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© OpenStreetMap'
            />
          </BaseLayer>

          {/* OpenSeaMap nautische laag (altijd aan voor boten) */}
          <Overlay checked name="🗺️ Nautische kaart (OpenSeaMap)">
            <TileLayer
              url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openseamap.org">OpenSeaMap</a>'
            />
          </Overlay>

          {/* Tracker lagen per type */}
          {Object.entries(ICOON_CONFIG).map(([type, cfg]) => (
            <Overlay checked key={type} name={`${cfg.emoji} ${cfg.label}`}>
              <LayerGroup>
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
            </Overlay>
          ))}

          {/* Route polyline */}
          {route.length > 1 && (
            <Overlay checked name="📍 Route">
              <LayerGroup>
                <Polyline
                  positions={route}
                  color={geselecteerd ? ICOON_CONFIG[geselecteerd.type]?.kleur : '#333'}
                  weight={3}
                  opacity={0.8}
                />
              </LayerGroup>
            </Overlay>
          )}
        </LayersControl>
      </MapContainer>

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
