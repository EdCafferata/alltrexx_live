import React, { useState, useEffect, useCallback } from 'react';
import { adminGetTrackers, adminSaveTracker, adminDeleteTracker } from '../services/api';
import './BeheerBoten.css';

const KEY_OPSLAG = 'alltrexx-admin-key';

// ── Beheerscherm: boten/AIS toevoegen, bekijken, verwijderen ────────────────
// De admin-key wordt lokaal in de browser bewaard (niet in de publieke bundle).
export default function BeheerBoten({ onSluiten }) {
  const [adminKey, setAdminKey] = useState(localStorage.getItem(KEY_OPSLAG) || '');
  const [keyOk, setKeyOk] = useState(false);
  const [trackers, setTrackers] = useState([]);
  const [fout, setFout] = useState(null);
  const [bezig, setBezig] = useState(false);

  // nieuw-boot formulier
  const [ais, setAis] = useState('');
  const [schipper, setSchipper] = useState('');
  const [bootnaam, setBootnaam] = useState('');

  // zoeken in de lijst (bootnaam, naam, MMSI, schipper, type)
  const [zoek, setZoek] = useState('');

  const laden = useCallback(async (key) => {
    setFout(null); setBezig(true);
    try {
      const data = await adminGetTrackers(key);
      setTrackers(data);
      setKeyOk(true);
      localStorage.setItem(KEY_OPSLAG, key);
    } catch (e) {
      setKeyOk(false);
      setFout(e?.response?.status === 401
        ? 'Ongeldige admin-key.'
        : 'Kon gegevens niet laden.');
    } finally { setBezig(false); }
  }, []);

  useEffect(() => { if (adminKey) laden(adminKey); /* eslint-disable-next-line */ }, []);

  const toevoegen = async (e) => {
    e.preventDefault();
    if (!ais.trim()) { setFout('AIS-nummer is verplicht.'); return; }
    setFout(null); setBezig(true);
    try {
      await adminSaveTracker(adminKey, {
        externeId: ais.trim(),
        type: 'BOAT',
        naam: bootnaam.trim() || ais.trim(),
        bootnaam: bootnaam.trim() || null,
        schipper: schipper.trim() || null,
      });
      setAis(''); setSchipper(''); setBootnaam('');
      await laden(adminKey);
    } catch (e) {
      setFout(e?.response?.status === 401 ? 'Ongeldige admin-key.' : 'Opslaan mislukt.');
    } finally { setBezig(false); }
  };

  const verwijderen = async (id) => {
    if (!window.confirm('Deze tracker verwijderen?')) return;
    setBezig(true);
    try { await adminDeleteTracker(adminKey, id); await laden(adminKey); }
    catch { setFout('Verwijderen mislukt.'); }
    finally { setBezig(false); }
  };

  // gefilterde lijst op basis van de zoekterm
  const term = zoek.trim().toLowerCase();
  const zichtbaar = term
    ? trackers.filter(t =>
        [t.bootnaam, t.naam, t.externeId, t.schipper, t.type]
          .some(v => (v || '').toString().toLowerCase().includes(term)))
    : trackers;

  return (
    <div className="beheer-overlay" onClick={onSluiten}>
      <div className="beheer-modal" onClick={e => e.stopPropagation()}>
        <div className="beheer-modal-kop">
          <span>🚢 Boten &amp; AIS beheren</span>
          <button className="beheer-sluit" onClick={onSluiten}>✕</button>
        </div>

        {/* Admin-key */}
        <div className="beheer-keyrij">
          <input
            type="password"
            placeholder="Admin-key"
            value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
          />
          <button onClick={() => laden(adminKey)} disabled={!adminKey || bezig}>
            {keyOk ? 'Vernieuwen' : 'Ontgrendelen'}
          </button>
        </div>

        {fout && <div className="beheer-fout">⚠️ {fout}</div>}

        {keyOk && (
          <>
            {/* Nieuwe boot */}
            <form className="beheer-form" onSubmit={toevoegen}>
              <input placeholder="AIS-nummer (MMSI) *" value={ais}
                     onChange={e => setAis(e.target.value)} />
              <input placeholder="Schipper" value={schipper}
                     onChange={e => setSchipper(e.target.value)} />
              <input placeholder="Bootnaam (optioneel — komt anders van AIS)" value={bootnaam}
                     onChange={e => setBootnaam(e.target.value)} />
              <button type="submit" disabled={bezig}>+ Toevoegen</button>
            </form>

            {/* Zoeken */}
            <div className="beheer-zoekrij">
              <input
                type="search"
                placeholder="🔎 Zoek op boot, MMSI of schipper…"
                value={zoek}
                onChange={e => setZoek(e.target.value)}
              />
              {zoek && (
                <span className="beheer-zoek-aantal">
                  {zichtbaar.length} / {trackers.length}
                </span>
              )}
            </div>

            {/* Lijst */}
            <div className="beheer-lijst">
              {trackers.length === 0 && <div className="beheer-leeg">Nog geen trackers.</div>}
              {trackers.length > 0 && zichtbaar.length === 0 && (
                <div className="beheer-leeg">Geen resultaten voor “{zoek}”.</div>
              )}
              {zichtbaar.map(t => (
                <div className="beheer-item" key={t.id}>
                  <div>
                    <strong>{t.bootnaam || t.naam}</strong>
                    <div className="beheer-sub">
                      AIS {t.externeId || '—'} · {t.schipper || 'geen schipper'} · {t.type}
                    </div>
                  </div>
                  <button className="beheer-del" onClick={() => verwijderen(t.id)}>🗑</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
