import React, { useState } from 'react';
import './BeheerBoten.css';
import './Instellingen.css';

const KEY_OPSLAG = 'alltrexx-admin-key';
const SLEUTEL_OPSLAG = 'alltrexx-sleutel';
const CONSENT_OPSLAG = 'alltrexx-consent';

function maskeer(v) {
  if (!v) return null;
  if (v.length <= 8) return '•'.repeat(v.length);
  return v.slice(0, 4) + '•'.repeat(Math.max(4, v.length - 8)) + v.slice(-4);
}

// ── Instellingen: lokaal opgeslagen gegevens in deze browser beheren ────────
export default function Instellingen({ onSluiten }) {
  const [adminKey, setAdminKey] = useState(localStorage.getItem(KEY_OPSLAG) || '');
  const [sleutel, setSleutel] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SLEUTEL_OPSLAG)); } catch { return null; }
  });
  const consent = (() => {
    try { return JSON.parse(localStorage.getItem(CONSENT_OPSLAG)); } catch { return null; }
  })();
  const [melding, setMelding] = useState(null);

  const wisAdminKey = () => {
    localStorage.removeItem(KEY_OPSLAG);
    setAdminKey('');
    setMelding('Admin-key verwijderd uit deze browser.');
  };

  const wisSleutel = () => {
    if (!window.confirm('App-sleutel verwijderen uit deze browser? De tracker zelf blijft bestaan — alleen de referentie hier verdwijnt.')) return;
    localStorage.removeItem(SLEUTEL_OPSLAG);
    setSleutel(null);
    setMelding('Sleutel verwijderd uit deze browser.');
  };

  const wisAlles = () => {
    if (!window.confirm('Alle lokale Alltrexx-gegevens in deze browser wissen (admin-key, sleutel, voorkeuren)? Je moet dan opnieuw inloggen.')) return;
    Object.keys(localStorage)
      .filter(k => k.startsWith('alltrexx-'))
      .forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  return (
    <div className="beheer-overlay" onClick={onSluiten}>
      <div className="beheer-modal" onClick={e => e.stopPropagation()}>
        <div className="beheer-modal-kop">
          <span>⚙️ Instellingen</span>
          <button className="beheer-sluit" onClick={onSluiten}>✕</button>
        </div>

        {melding && <div className="ins-melding">{melding}</div>}

        <div className="ins-sectie-titel">Deze browser</div>
        <div className="beheer-lijst">
          <div className="beheer-item">
            <div className="beheer-info">
              <strong>🔑 Admin-key</strong>
              <div className="beheer-sub">{adminKey ? maskeer(adminKey) : 'Niet opgeslagen'}</div>
            </div>
            {adminKey && (
              <div className="beheer-acties">
                <button className="beheer-wis" onClick={wisAdminKey}>Wissen</button>
              </div>
            )}
          </div>
          <div className="beheer-item">
            <div className="beheer-info">
              <strong>📱 App-sleutel</strong>
              <div className="beheer-sub">
                {sleutel ? `${sleutel.naam} · ${maskeer(sleutel.token)}` : 'Nog geen sleutel aangemaakt'}
              </div>
            </div>
            {sleutel && (
              <div className="beheer-acties">
                <button className="beheer-wis" onClick={wisSleutel}>Wissen</button>
              </div>
            )}
          </div>
          <div className="beheer-item">
            <div className="beheer-info">
              <strong>🍪 Toestemming</strong>
              <div className="beheer-sub">
                {consent
                  ? `Gegeven op ${new Date(consent.tijdstip).toLocaleDateString('nl-NL')}${consent.statistiek ? ' · incl. statistieken' : ''}`
                  : 'Nog niet vastgelegd'}
              </div>
            </div>
          </div>
        </div>

        <button className="ins-alles-wissen" onClick={wisAlles}>🧹 Alle lokale gegevens wissen</button>

        <div className="ins-sectie-titel">Over Alltrexx Live</div>
        <div className="ins-over">
          Realtime tracking voor boten, fietsen, auto's, vliegtuigen en meer.
          <br />
          <a href="https://github.com/EdCafferata/alltrexx_live" target="_blank" rel="noopener noreferrer">
            Broncode op GitHub ↗
          </a>
        </div>
      </div>
    </div>
  );
}
