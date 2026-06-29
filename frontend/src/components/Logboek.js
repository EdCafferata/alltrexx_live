import React, { useState, useEffect, useCallback } from 'react';
import { getRoute } from '../services/api';
import './Logboek.css';

// Periodeknoppen boven het logboek. 'Alles' = ruime bovengrens (10 jaar).
const PERIODES = [
  { code: 'dag',   label: 'Dag',   uur: 24 },
  { code: 'week',  label: 'Week',  uur: 168 },
  { code: 'maand', label: 'Maand', uur: 744 },
  { code: 'alles', label: 'Alles', uur: 87600 },
];

// Alle voertuigtypes voor de selectie boven de periodeknoppen.
const TYPES = [
  { code: 'ALL',    label: '🌐 Alle types' },
  { code: 'BOAT',   label: '⛵ Boot' },
  { code: 'BIKE',   label: '🚴 Fiets' },
  { code: 'CAR',    label: '🚗 Auto' },
  { code: 'PLANE',  label: '✈️ Vliegtuig' },
  { code: 'PERSON', label: '🚶 Persoon' },
  { code: 'TRAIN',  label: '🚆 Trein' },
];

function eigenSleutel() {
  try { return JSON.parse(localStorage.getItem('alltrexx-sleutel')); }
  catch { return null; }
}

// Logboek voor de FREE-gebruiker: alleen de eigen tracker-data, per periode.
export default function Logboek() {
  const sleutel = eigenSleutel();
  const [type, setType] = useState(sleutel?.type || 'BOAT');
  const [periode, setPeriode] = useState('week');
  const [posities, setPosities] = useState([]);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState(null);

  const laden = useCallback(() => {
    if (!sleutel?.id) return;
    const p = PERIODES.find(x => x.code === periode);
    setBezig(true); setFout(null);
    getRoute(sleutel.id, p.uur)
      .then(rows => setPosities(rows || []))
      .catch(e => setFout(e.message))
      .finally(() => setBezig(false));
  }, [periode, sleutel?.id]);

  useEffect(() => { laden(); }, [laden]);

  if (!sleutel?.id) {
    return <div className="logboek-leeg">Maak eerst een gratis sleutel aan om je eigen logboek te zien.</div>;
  }

  const tijd = (iso) => new Date(iso).toLocaleString('nl-NL', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="logboek">
      <select className="logboek-type" value={type} onChange={e => setType(e.target.value)}>
        {TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
      </select>

      <div className="logboek-periodes">
        {PERIODES.map(p => (
          <button key={p.code}
            className={'logboek-periode' + (p.code === periode ? ' actief' : '')}
            onClick={() => setPeriode(p.code)}>{p.label}</button>
        ))}
      </div>

      <div className="logboek-bron">📍 {sleutel.naam}</div>

      {bezig && <div className="logboek-info">Laden…</div>}
      {fout && <div className="account-fout">⚠️ {fout}</div>}
      {!bezig && !fout && posities.length === 0 && (
        <div className="logboek-info">Geen data in deze periode.</div>
      )}

      {posities.length > 0 && (
        <ul className="logboek-lijst">
          {posities.map((p, i) => (
            <li key={i} className="logboek-rij">
              <span className="logboek-tijd">{tijd(p.tijdstip)}</span>
              <span className="logboek-pos">{p.lat.toFixed(4)}, {p.lon.toFixed(4)}</span>
              {type === 'PLANE' ? (
                <span className="logboek-extra">{Math.round(p.hoogte)} m · {Math.round(p.koers)}°</span>
              ) : (
                <span className="logboek-snelheid">{p.snelheid.toFixed(1)} kn</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
