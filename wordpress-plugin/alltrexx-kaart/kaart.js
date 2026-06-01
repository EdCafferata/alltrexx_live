/**
 * Alltrexx Live Kaart — WordPress plugin frontend
 * Leaflet kaart met live tracker posities.
 */
(function () {
    'use strict';

    const ICOON = {
        BOAT:   '⛵',
        BIKE:   '🚴',
        CAR:    '🚗',
        PLANE:  '✈️',
        PERSON: '🚶',
    };

    const KLEUR = {
        BOAT:   '#1565C0',
        BIKE:   '#2E7D32',
        CAR:    '#E65100',
        PLANE:  '#6A1B9A',
        PERSON: '#00695C',
    };

    function maakDivIcoon(type, koers) {
        return L.divIcon({
            html: `<div style="font-size:22px;transform:rotate(${koers || 0}deg);
                              filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))">
                     ${ICOON[type] || '📍'}
                   </div>`,
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
        });
    }

    document.querySelectorAll('[data-api]').forEach(el => {
        const apiUrl = el.dataset.api;

        // Initialiseer kaart
        const kaart = L.map(el).setView([52.5, 5.0], 7);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://osm.org/copyright">OpenStreetMap</a>',
        }).addTo(kaart);

        L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openseamap.org">OpenSeaMap</a>',
        }).addTo(kaart);

        const markers = {};

        function verversKaart() {
            fetch(`${apiUrl}/api/kaart/live`)
                .then(r => r.json())
                .then(posities => {
                    posities.forEach(pos => {
                        const key = pos.trackerId;
                        const latlng = [pos.lat, pos.lon];

                        if (markers[key]) {
                            markers[key].setLatLng(latlng);
                            markers[key].setIcon(maakDivIcoon(pos.type, pos.koers));
                        } else {
                            const m = L.marker(latlng, {
                                icon: maakDivIcoon(pos.type, pos.koers),
                            }).addTo(kaart);

                            m.bindPopup(`
                                <strong>${ICOON[pos.type] || ''} ${pos.trackerNaam}</strong><br>
                                🚀 ${pos.snelheid.toFixed(1)} km/u &nbsp;
                                🧭 ${pos.koers.toFixed(0)}°<br>
                                <small>${new Date(pos.tijdstip).toLocaleString('nl-NL')}</small>
                            `);
                            markers[key] = m;
                        }
                    });
                })
                .catch(e => console.warn('Alltrexx API fout:', e));
        }

        verversKaart();
        setInterval(verversKaart, 30_000); // elke 30 sec
    });
})();
