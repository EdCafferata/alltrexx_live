import React, { useState, useEffect, useCallback } from 'react';
import { adminGetTrackers, adminSaveTracker, adminDeleteTracker, adminWisPosities } from '../services/api';
import './BeheerBoten.css';

const KEY_OPSLAG = 'alltrexx-admin-key';

// Alle tracker-types die je kunt beheren (moet overeenkomen met TrackerType in de backend)
const TYPES = [
  { type: 'BOAT',   label: '⛵ Boot',       idLabel: 'AIS-nummer (MMSI)' },
  { type: 'PERSON', label: '🚶 Voetganger', idLabel: 'ID / device-id' },
  { type: 'BIKE',   label: '🚴 Fietser',    idLabel: 'ID / device-id' },
  { type: 'CAR',    label: '🚗 Auto',       idLabel: 'ID / kenteken' },
  { type: 'TRAIN',  label: '🚆 Trein',      idLabel: 'ID / treinnummer' },
  { type: 'PLANE',  label: '✈️ Vliegtuig',  idLabel: 'ID / vluchtnummer' },
];

// ── Beheerscherm: boten/AIS toevoegen, bekijken, verwijderen ────────────────
// De admin-key wordt lokaal in de browser bewaard (niet in de publieke bundle).
export default function BeheerBoten({ onSluiten }) {
  const [adminKey, setAdminKey] = useState(localStorage.getItem(KEY_OPSLAG) || '');
  const [keyOk, setKeyOk] = useState(false);
  const [trackers, setTrackers] = useState([]);
  const [fout, setFout] = useState(null);
  const [bezig, setBezig] = useState(false);

  // nieuwe-tracker formulier
  const [type, setType] = useState('BOAT');
  const [ais, setAis] = useState('');
  const [schipper, setSchipper] = useState('');
  const [bootnaam, setBootnaam] = useState('');
  const typeCfg = TYPES.find(t => t.type === type) || TYPES[0];

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
    if (!ais.trim()) { setFout(`${typeCfg.idLabel} is verplicht.`); return; }
    setFout(null); setBezig(true);
    try {
      await adminSaveTracker(adminKey, {
        externeId: ais.trim(),
        type,
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

  const wisData = async (t) => {
    const naam = t.bootnaam || t.naam;
    if (!window.confirm(`Alle track-data van ${naam} wissen? De boot zelf blijft staan.`)) return;
    setBezig(true);
    try { await adminWisPosities(adminKey, t.id); await laden(adminKey); }
    catch { setFout('Track-data wissen mislukt.'); }
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
          <span>🛰️ Trackers beheren</span>
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
            {/* Nieuwe tracker */}
            <form className="beheer-form" onSubmit={toevoegen}>
              <select className="beheer-type" value={type}
                      onChange={e => setType(e.target.value)}>
                {TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
              </select>
              <input placeholder={`${typeCfg.idLabel} *`} value={ais}
                     onChange={e => setAis(e.target.value)} />
              <input placeholder={type === 'BOAT' ? 'Schipper' : 'Bestuurder / eigenaar'} value={schipper}
                     onChange={e => setSchipper(e.target.value)} />
              <input placeholder={type === 'BOAT'
                       ? 'Bootnaam (optioneel — komt anders van AIS)'
                       : 'Naam / label (optioneel)'} value={bootnaam}
                     onChange={e => setBootnaam(e.target.value)} />
              <button type="submit" disabled={bezig}>+ Toevoegen</button>
            </form>

            {/* Zoeken */}
            <div className="beheer-zoekrij">
              <input
                type="search"
                placeholder="🔎 Zoek op naam, ID/MMSI, bestuurder of type…"
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
                  <div className="beheer-acties">
                    <button className="beheer-wis" title="Wis track-data (boot blijft)"
                            onClick={() => wisData(t)}>🧹 Wis data</button>
                    <button className="beheer-del" title="Boot verwijderen"
                            onClick={() => verwijderen(t.id)}>🗑</button>
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
