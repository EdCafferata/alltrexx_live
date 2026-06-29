import React, { useEffect, useState } from 'react';
import { getBronnen } from '../services/api';
import './BronnenTicker.css';

// Vaste bronnen die we tonen (ook als er nog geen data is)
const BRONNEN = [
  { code: 'AISHUB', label: 'AISHub', url: 'https://www.aishub.net' },
  { code: 'ADSB',   label: 'ADS-B',  url: 'https://airplanes.live' },
  // Kpler tijdelijk verborgen: wacht nog op client-grant. Terugzetten = deze regel
  // uit-commentariëren zodra de KplerScheduler data levert (bron-code 'KPLER').
  // { code: 'KPLER', label: 'Kpler', url: 'https://developers.kpler.com' },
];

function tijdLabel(iso) {
  if (!iso) return 'nog geen data';
  const d = new Date(iso);
  if (isNaN(d)) return 'nog geen data';
  return 'laatste update ' + d.toLocaleString('nl-NL', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

// Korte tijd voor telefoon: alleen uur:minuut (geen dag/maand).
function tijdKort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

// Twee chips die over het scherm zweven, met de bron-URL en laatste-update-tijd.
export default function BronnenTicker() {
  const [status, setStatus] = useState({});

  const laden = () => {
    getBronnen()
      .then(rows => {
        const map = {};
        (rows || []).forEach(r => { map[r.bron] = r; });
        setStatus(map);
      })
      .catch(() => { /* stil: ticker toont dan 'nog geen data' */ });
  };

  useEffect(() => {
    laden();
    const t = setInterval(laden, 60000); // elke minuut verversen
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bron-ticker" aria-hidden="false">
      {BRONNEN.map((b) => {
        const s = status[b.code];
        return (
          <a key={b.code} href={b.url} target="_blank" rel="noopener noreferrer"
             className="bron-chip">
            <span className="bron-dot" />
            <span className="bron-icon" aria-hidden="true">📡</span>
            <span className="bron-naam">{b.label}</span>
            <span className="bron-url">{b.url.replace(/^https?:\/\//, '')}</span>
            <span className="bron-tijd">{tijdLabel(s?.laatste)}</span>
            <span className="bron-tijd-kort">{tijdKort(s?.laatste)}</span>
          </a>
        );
      })}
    </div>
  );
}
