import React, { useState, useEffect, useCallback } from 'react';
import { adminGetGebruikers, adminZetAbonnement, adminVerwijderGebruiker } from '../services/api';
import './BeheerBoten.css';
import './BeheerGebruikers.css';

const KEY_OPSLAG = 'alltrexx-admin-key';

// Beheerscherm: Pro-vlaggen zetten/verwijderen + gebruikers verwijderen.
export default function BeheerGebruikers({ onSluiten }) {
  const [adminKey, setAdminKey] = useState(localStorage.getItem(KEY_OPSLAG) || '');
  const [keyOk, setKeyOk] = useState(false);
  const [gebruikers, setGebruikers] = useState([]);
  const [fout, setFout] = useState(null);
  const [bezig, setBezig] = useState(false);

  const laden = useCallback(async (key) => {
    setBezig(true); setFout(null);
    try {
      localStorage.setItem(KEY_OPSLAG, key);
      const rows = await adminGetGebruikers(key);
      setGebruikers(rows || []);
      setKeyOk(true);
    } catch (e) {
      setKeyOk(false);
      setFout(e?.response?.status === 401 ? 'Ongeldige admin-key.' : 'Laden mislukt.');
    } finally { setBezig(false); }
  }, []);

  useEffect(() => { if (adminKey) laden(adminKey); /* eslint-disable-next-line */ }, []);

  const wisselAbonnement = async (g) => {
    const nieuw = g.abonnement === 'PRO' ? 'FREE' : 'PRO';
    try { await adminZetAbonnement(adminKey, g.id, nieuw); await laden(adminKey); }
    catch { setFout('Bijwerken mislukt.'); }
  };

  const verwijder = async (g) => {
    if (!window.confirm(`Gebruiker "${g.naam || g.externeId}" verwijderen?`)) return;
    try { await adminVerwijderGebruiker(adminKey, g.id); await laden(adminKey); }
    catch { setFout('Verwijderen mislukt.'); }
  };

  const tijd = (iso) => iso
    ? new Date(iso).toLocaleString('nl-NL', {
        day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="beheer-overlay" onClick={onSluiten}>
      <div className="beheer-modal" onClick={e => e.stopPropagation()}>
        <div className="beheer-modal-kop">
          <span>👥 Gebruikers beheren</span>
          <button className="beheer-sluit" onClick={onSluiten}>✕</button>
        </div>

        <div className="beheer-keyrij">
          <input type="password" placeholder="Admin-key" value={adminKey}
                 onChange={e => setAdminKey(e.target.value)} />
          <button onClick={() => laden(adminKey)} disabled={!adminKey || bezig}>
            {keyOk ? 'Vernieuwen' : 'Ontgrendelen'}
          </button>
        </div>

        {fout && <div className="beheer-fout">⚠️ {fout}</div>}

        {keyOk && (
          <ul className="gebr-lijst">
            {gebruikers.map(g => (
              <li key={g.id} className="gebr-rij">
                <div className="gebr-info">
                  <span className="gebr-naam">{g.naam || '(anoniem)'} {g.beheerder && '🛠️'}</span>
                  <span className="gebr-id">{g.externeId.slice(0, 14)}…</span>
                  <span className="gebr-login">login: {tijd(g.laatsteLogin)}</span>
                </div>
                <div className="gebr-acties">
                  <button className={'gebr-badge ' + (g.abonnement === 'PRO' ? 'pro' : 'free')}
                          onClick={() => wisselAbonnement(g)} title="Klik om PRO/FREE te wisselen">
                    {g.abonnement === 'PRO' ? '⭐ PRO' : 'FREE'}
                  </button>
                  <button className="gebr-del" onClick={() => verwijder(g)} title="Verwijderen">🗑️</button>
                </div>
              </li>
            ))}
            {!bezig && gebruikers.length === 0 && (
              <li className="beheer-info">Nog geen gebruikers aangemeld.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
