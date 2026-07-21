import React, { useState, useEffect, useCallback } from 'react';
import { adminGetTrackers, getRoute } from '../services/api';
import './BeheerBoten.css';
import './DataZoeken.css';

const KEY_OPSLAG = 'alltrexx-admin-key';

// Periodeknoppen — zelfde stramien als Logboek.js.
const PERIODES = [
  { code: 'dag',   label: 'Dag',   uur: 24 },
  { code: 'week',  label: 'Week',  uur: 168 },
  { code: 'maand', label: 'Maand', uur: 744 },
  { code: 'alles', label: 'Alles', uur: 87600 },
];

// ── Beheerscherm: track-historie van een willekeurige tracker doorzoeken ────
export default function DataZoeken({ onSluiten }) {
  const [adminKey, setAdminKey] = useState(localStorage.getItem(KEY_OPSLAG) || '');
  const [keyOk, setKeyOk] = useState(false);
  const [trackers, setTrackers] = useState([]);
  const [trackerId, setTrackerId] = useState('');
  const [periode, setPeriode] = useState('week');
  const [posities, setPosities] = useState([]);
  const [zoek, setZoek] = useState('');
  const [fout, setFout] = useState(null);
  const [bezig, setBezig] = useState(false);

  const laadTrackers = useCallback(async (key) => {
    setFout(null); setBezig(true);
    try {
      const data = await adminGetTrackers(key);
      setTrackers(data);
      setKeyOk(true);
      localStorage.setItem(KEY_OPSLAG, key);
      setTrackerId(prev => prev || (data[0] ? String(data[0].id) : ''));
    } catch (e) {
      setKeyOk(false);
      setFout(e?.response?.status === 401 ? 'Ongeldige admin-key.' : 'Kon trackers niet laden.');
    } finally { setBezig(false); }
  }, []);

  useEffect(() => { if (adminKey) laadTrackers(adminKey); /* eslint-disable-next-line */ }, []);

  const zoeken = useCallback(async () => {
    if (!trackerId) return;
    setBezig(true); setFout(null);
    try {
      const uur = PERIODES.find(p => p.code === periode).uur;
      const data = await getRoute(trackerId, uur);
      setPosities((data || []).slice().reverse()); // nieuwste eerst
    } catch {
      setFout('Kon posities niet laden.');
    } finally { setBezig(false); }
  }, [trackerId, periode]);

  useEffect(() => { if (keyOk && trackerId) zoeken(); }, [keyOk, trackerId, periode, zoeken]);

  const tijd = (iso) => new Date(iso).toLocaleString('nl-NL', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  const term = zoek.trim().toLowerCase();
  const zichtbaar = term
    ? posities.filter(p => [tijd(p.tijdstip), p.lat, p.lon]
        .some(v => (v ?? '').toString().toLowerCase().includes(term)))
    : posities;

  const gekozenTracker = trackers.find(t => String(t.id) === String(trackerId));

  return (
    <div className="beheer-overlay" onClick={onSluiten}>
      <div className="beheer-modal" onClick={e => e.stopPropagation()}>
        <div className="beheer-modal-kop">
          <span>🔍 Data zoeken</span>
          <button className="beheer-sluit" onClick={onSluiten}>✕</button>
        </div>

        <div className="beheer-keyrij">
          <input
            type="password"
            placeholder="Admin-key"
            value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
          />
          <button onClick={() => laadTrackers(adminKey)} disabled={!adminKey || bezig}>
            {keyOk ? 'Vernieuwen' : 'Ontgrendelen'}
          </button>
        </div>

        {fout && <div className="beheer-fout">⚠️ {fout}</div>}

        {keyOk && (
          <>
            <select className="beheer-type dz-select" value={trackerId}
                    onChange={e => setTrackerId(e.target.value)}>
              {trackers.length === 0 && <option value="">Geen trackers</option>}
              {trackers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.bootnaam || t.naam} ({t.type})
                </option>
              ))}
            </select>

            <div className="dz-periodes">
              {PERIODES.map(p => (
                <button key={p.code} type="button"
                        className={'dz-periode' + (p.code === periode ? ' actief' : '')}
                        onClick={() => setPeriode(p.code)}>{p.label}</button>
              ))}
            </div>

            <div className="beheer-zoekrij">
              <input
                type="search"
                placeholder="🔎 Filter op tijd of positie…"
                value={zoek}
                onChange={e => setZoek(e.target.value)}
              />
              {zoek && (
                <span className="beheer-zoek-aantal">{zichtbaar.length} / {posities.length}</span>
              )}
            </div>

            <div className="beheer-lijst dz-lijst">
              {bezig && <div className="beheer-leeg">Laden…</div>}
              {!bezig && posities.length === 0 && (
                <div className="beheer-leeg">
                  Geen posities in deze periode voor {gekozenTracker?.naam || 'deze tracker'}.
                </div>
              )}
              {!bezig && posities.length > 0 && zichtbaar.length === 0 && (
                <div className="beheer-leeg">Geen resultaten voor “{zoek}”.</div>
              )}
              {zichtbaar.map((p, i) => (
                <div className="beheer-item dz-item" key={i}>
                  <div className="beheer-info">
                    <strong className="dz-tijd">{tijd(p.tijdstip)}</strong>
                    <div className="beheer-sub">
                      {p.lat.toFixed(4)}, {p.lon.toFixed(4)}
                      {' · '}
                      {p.type === 'PLANE'
                        ? `${Math.round(p.hoogte)} m · ${Math.round(p.koers)}°`
                        : `${p.snelheid.toFixed(1)} kn`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
