import React, { useState, useEffect, useCallback } from 'react';
import { adminGetTrackers, adminSaveTracker, adminDeleteTracker, adminWisPosities } from '../services/api';
import './BeheerBoten.css';

const KEY_OPSLAG = 'alltrexx-admin-key';

// Alle tracker-types die je kunt beheren (moet overeenkomen met TrackerType in de backend).
// 'extern' = extern volg-ID (sleutel voor een databron, zoals AIS/ADS-B). Types zonder
// 'extern' worden door de mobiele app gevolgd op telefoonnummer (+ token).
const TYPES = [
  { type: 'BOAT',   label: '⛵ Boot',       extern: 'AIS-nummer (MMSI)', idKort: 'MMSI' },
  { type: 'PLANE',  label: '✈️ Vliegtuig',  extern: 'ICAO hex (24-bit)', idKort: 'ICAO' },
  { type: 'PERSON', label: '🚶 Voetganger' },
  { type: 'BIKE',   label: '🚴 Fietser' },
  { type: 'CAR',    label: '🚗 Auto' },
  { type: 'TRAIN',  label: '🚆 Trein' },
];
const typeConfig = (t) => TYPES.find(x => x.type === t);

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
  const [naam, setNaam] = useState('');
  const [telefoon, setTelefoon] = useState('');
  const [ais, setAis] = useState(''); // extern volg-ID (MMSI / ICAO hex)
  const typeCfg = typeConfig(type) || TYPES[0];
  const heeftExtern = !!typeCfg.extern; // BOAT/PLANE: extern ID; anders telefoon

  // zoeken in de lijst (bootnaam, naam, MMSI, schipper, type)
  const [zoek, setZoek] = useState('');
  const [gekopieerd, setGekopieerd] = useState(null); // welke token net gekopieerd is

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
    // Extern getrackt (boot=MMSI, vliegtuig=ICAO hex) → match op extern ID;
    // overige types → match op telefoonnummer (sleutel voor de mobiele app).
    if (heeftExtern && !ais.trim()) { setFout(`${typeCfg.extern} is verplicht.`); return; }
    if (!heeftExtern && !telefoon.trim()) { setFout('Telefoonnummer is verplicht.'); return; }
    if (!naam.trim()) { setFout('Naam is verplicht.'); return; }
    setFout(null); setBezig(true);
    try {
      await adminSaveTracker(adminKey, {
        type,
        naam: naam.trim(),
        telefoon: telefoon.trim() || null,
        // matching-sleutel: extern ID (lowercase voor hex-match), anders telefoonnummer
        externeId: heeftExtern ? ais.trim().toLowerCase() : telefoon.trim(),
        schipper: heeftExtern ? naam.trim() : null,
      });
      setNaam(''); setTelefoon(''); setAis('');
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

  const kopieer = async (token) => {
    try {
      await navigator.clipboard.writeText(token);
      setGekopieerd(token);
      setTimeout(() => setGekopieerd(null), 1500);
    } catch { /* clipboard niet beschikbaar — negeren */ }
  };

  const wisData = async (t) => {
    const label = t.bootnaam || t.naam;
    if (!window.confirm(`Alle track-data van ${label} wissen? De tracker zelf blijft staan.`)) return;
    setBezig(true);
    try { await adminWisPosities(adminKey, t.id); await laden(adminKey); }
    catch { setFout('Track-data wissen mislukt.'); }
    finally { setBezig(false); }
  };

  // gefilterde lijst op basis van de zoekterm
  const term = zoek.trim().toLowerCase();
  const zichtbaar = term
    ? trackers.filter(t =>
        [t.bootnaam, t.naam, t.externeId, t.schipper, t.telefoon, t.type]
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
              <input placeholder="Naam *" value={naam}
                     onChange={e => setNaam(e.target.value)} />
              {heeftExtern && (
                <input placeholder={`${typeCfg.extern} *`} value={ais}
                       onChange={e => setAis(e.target.value)} />
              )}
              <input type="tel" placeholder={heeftExtern ? 'Telefoonnummer (optioneel)' : 'Telefoonnummer *'}
                     value={telefoon} onChange={e => setTelefoon(e.target.value)} />
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
                  <div className="beheer-info">
                    <strong>{t.bootnaam || t.naam}</strong>
                    <div className="beheer-sub">
                      {(typeConfig(t.type) || {}).label || t.type}
                      {' · '}
                      {typeConfig(t.type)?.extern
                        ? `${typeConfig(t.type).idKort} ${t.externeId || '—'}`
                        : `📞 ${t.telefoon || t.externeId || '—'}`}
                      {typeConfig(t.type)?.extern && t.telefoon ? ` · 📞 ${t.telefoon}` : ''}
                    </div>
                    {!typeConfig(t.type)?.extern && t.token && (
                      <div className="beheer-token" title="Token voor de mobiele app">
                        🔑 <code>{t.token}</code>
                        <button type="button" className="beheer-kopieer"
                          onClick={() => kopieer(t.token)}>
                          {gekopieerd === t.token ? '✓' : '📋'}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="beheer-acties">
                    <button className="beheer-wis" title="Wis track-data (tracker blijft)"
                            onClick={() => wisData(t)}>🧹 Wis data</button>
                    <button className="beheer-del" title="Tracker verwijderen"
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
