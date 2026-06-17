import React, { useState } from 'react';
import { adminZoekIcao } from '../services/api';
import './VliegtuigZoek.css';

// Vliegtuig-specifiek: zoek de ICAO 24-bit hex bij een registratie (bv. PH-USN) via
// hexdb.io. Apart gehouden van het generieke beheerscherm zodat vliegtuig-logica
// netjes gescheiden blijft. onHex(hex, reg) wordt aangeroepen zodra de hex gevonden is.
export default function VliegtuigZoek({ adminKey, onHex }) {
  const [reg, setReg] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState(null);

  const zoek = async () => {
    if (!reg.trim()) return;
    setFout(null); setBezig(true);
    try {
      const d = await adminZoekIcao(adminKey, reg.trim());
      onHex(d.hex, d.reg);
    } catch (e) {
      setFout(e?.response?.status === 404
        ? `Geen ICAO-hex gevonden voor ${reg.trim().toUpperCase()}.`
        : 'Opzoeken mislukt.');
    } finally { setBezig(false); }
  };

  return (
    <div className="vlieg-zoek">
      <div className="vlieg-zoek-rij">
        <input placeholder="Registratie (bv. PH-USN)" value={reg}
               onChange={e => setReg(e.target.value)} />
        <button type="button" onClick={zoek} disabled={bezig || !reg.trim()}>
          🔎 Zoek hex
        </button>
      </div>
      {fout && <div className="vlieg-zoek-fout">⚠️ {fout}</div>}
    </div>
  );
}
