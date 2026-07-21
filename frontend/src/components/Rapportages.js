import React, { useState, useEffect, useCallback } from 'react';
import { adminGetTrackers, getBronnen } from '../services/api';
import './BeheerBoten.css';
import './Rapportages.css';

const KEY_OPSLAG = 'alltrexx-admin-key';

const TYPE_LABELS = {
  BOAT: '⛵ Boot', PLANE: '✈️ Vliegtuig', PERSON: '🚶 Voetganger',
  BIKE: '🚴 Fietser', CAR: '🚗 Auto', TRAIN: '🚆 Trein',
};

const BRON_LABELS = {
  AISHUB: '⛵ AIS (AISHub)', ADSB: '✈️ ADS-B', MOBIEL: '📱 Mobiele app', KPLER: '⛵ Kpler',
};

function geledenTekst(iso) {
  if (!iso) return 'nooit';
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'zojuist';
  if (min < 60) return `${min} min geleden`;
  const uur = Math.floor(min / 60);
  if (uur < 24) return `${uur} uur geleden`;
  return `${Math.floor(uur / 24)} dagen geleden`;
}

// ── Beheerscherm: overzicht van trackers per type + databronnen-statistieken ─
export default function Rapportages({ onSluiten }) {
  const [adminKey, setAdminKey] = useState(localStorage.getItem(KEY_OPSLAG) || '');
  const [keyOk, setKeyOk] = useState(false);
  const [trackers, setTrackers] = useState([]);
  const [bronnen, setBronnen] = useState([]);
  const [fout, setFout] = useState(null);
  const [bezig, setBezig] = useState(false);

  const laden = useCallback(async (key) => {
    setFout(null); setBezig(true);
    try {
      const [tr, br] = await Promise.all([adminGetTrackers(key), getBronnen()]);
      setTrackers(tr);
      setBronnen(br || []);
      setKeyOk(true);
      localStorage.setItem(KEY_OPSLAG, key);
    } catch (e) {
      setKeyOk(false);
      setFout(e?.response?.status === 401 ? 'Ongeldige admin-key.' : 'Kon gegevens niet laden.');
    } finally { setBezig(false); }
  }, []);

  useEffect(() => { if (adminKey) laden(adminKey); /* eslint-disable-next-line */ }, []);

  const perType = Object.keys(TYPE_LABELS)
    .map(type => ({
      type,
      label: TYPE_LABELS[type],
      aantal: trackers.filter(t => t.type === type).length,
    }))
    .filter(x => x.aantal > 0);

  const totaalPosities = bronnen.reduce((som, b) => som + Number(b.aantal || 0), 0);

  return (
    <div className="beheer-overlay" onClick={onSluiten}>
      <div className="beheer-modal" onClick={e => e.stopPropagation()}>
        <div className="beheer-modal-kop">
          <span>📊 Rapportages</span>
          <button className="beheer-sluit" onClick={onSluiten}>✕</button>
        </div>

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
            <div className="rap-sectie-titel">Trackers ({trackers.length} totaal)</div>
            <div className="rap-grid">
              {perType.map(x => (
                <div className="rap-kaart" key={x.type}>
                  <div className="rap-kaart-getal">{x.aantal}</div>
                  <div className="rap-kaart-label">{x.label}</div>
                </div>
              ))}
              {perType.length === 0 && <div className="beheer-leeg">Nog geen trackers.</div>}
            </div>

            <div className="rap-sectie-titel">
              Databronnen ({totaalPosities.toLocaleString('nl-NL')} posities totaal)
            </div>
            <div className="beheer-lijst">
              {bronnen.length === 0 && <div className="beheer-leeg">Nog geen data binnengekomen.</div>}
              {bronnen.map(b => (
                <div className="beheer-item" key={b.bron}>
                  <div className="beheer-info">
                    <strong>{BRON_LABELS[b.bron] || b.bron}</strong>
                    <div className="beheer-sub">
                      {Number(b.aantal).toLocaleString('nl-NL')} posities · laatste update {geledenTekst(b.laatste)}
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
