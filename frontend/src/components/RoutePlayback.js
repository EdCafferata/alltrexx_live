import React from 'react';
import './RoutePlayback.css';

/**
 * Afspeelbalk voor de route van een geselecteerde tracker ("tijdreis"). Puur
 * presentatie: de index/afspeel-status/snelheid worden door TrackerKaart beheerd,
 * zodat de bijbehorende marker + afgelegde route op de kaart kunnen meebewegen.
 */

const SNELHEDEN = [1, 2, 4, 8];

function fmtTijd(t) {
  if (!t) return '—';
  const d = new Date(t);
  return d.toLocaleString('nl-NL', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function RoutePlayback({
  route, naam, emoji, index, spelen, snelheid,
  onSpeel, onPauze, onSeek, onSnelheid, onSluit,
}) {
  if (!route || route.length < 2) return null;
  const huidige = route[Math.min(index, route.length - 1)];
  const aanEind = index >= route.length - 1;

  return (
    <div className="rp-balk" role="group" aria-label="Route afspelen">
      <div className="rp-kop">
        <span className="rp-titel">🎬 {emoji} {naam}</span>
        <button className="rp-sluit" onClick={onSluit} title="Afspelen sluiten">✕</button>
      </div>

      <div className="rp-regel">
        <button
          className="rp-play"
          onClick={spelen ? onPauze : onSpeel}
          title={spelen ? 'Pauzeren' : (aanEind ? 'Opnieuw afspelen' : 'Afspelen')}
        >
          {spelen ? '⏸' : (aanEind ? '↻' : '▶')}
        </button>
        <input
          className="rp-slider"
          type="range"
          min={0}
          max={route.length - 1}
          value={index}
          onChange={e => onSeek(Number(e.target.value))}
          aria-label="Tijdbalk"
        />
      </div>

      <div className="rp-info">
        <span className="rp-tijd">🕐 {fmtTijd(huidige?.tijdstip)}</span>
        <span className="rp-speed">🚀 {(huidige?.snelheid ?? 0).toFixed(1)} km/u</span>
        <span className="rp-voortgang">{index + 1} / {route.length}</span>
      </div>

      <div className="rp-snelheden">
        <span className="rp-sn-label">Snelheid</span>
        {SNELHEDEN.map(s => (
          <button
            key={s}
            className={`rp-sn ${snelheid === s ? 'rp-sn-actief' : ''}`}
            onClick={() => onSnelheid(s)}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}
