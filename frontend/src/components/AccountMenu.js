import React, { useState, useEffect } from 'react';
import { startLogin, logUit, huidigeGebruiker } from '../services/cloudkit';
import './AccountMenu.css';

// ── Logo-knop linksboven: account, login/registratie (CloudKit) en beheer ────
export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [gebruiker, setGebruiker] = useState(null);
  const [fout, setFout] = useState(null);
  const [bezig, setBezig] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  // AVG-toestemmingen
  const [akkoordNoodzakelijk, setAkkoordNoodzakelijk] = useState(false);
  const [akkoordStatistiek, setAkkoordStatistiek] = useState(false);

  useEffect(() => { huidigeGebruiker().then(setGebruiker); }, []);

  // Zodra het verplichte vinkje aan staat: CloudKit laten tekenen in
  // #apple-sign-in-button en wachten tot de gebruiker daarmee inlogt.
  useEffect(() => {
    if (!akkoordNoodzakelijk || gebruiker) return;
    setFout(null); setBezig(true);
    startLogin()
      .then(g => {
        setGebruiker(g);
        // Toestemmingskeuzes lokaal bewaren (niet op de server)
        localStorage.setItem('alltrexx-consent', JSON.stringify({
          noodzakelijk: true,
          statistiek: akkoordStatistiek,
          tijdstip: new Date().toISOString(),
        }));
      })
      .catch(e => setFout(e.message))
      .finally(() => setBezig(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [akkoordNoodzakelijk]);

  const uitloggen = async () => {
    try { await logUit(); } catch { /* sessie lokaal opruimen volstaat */ }
    setGebruiker(null);
  };

  return (
    <>
      <button className="logo-badge" onClick={() => setOpen(!open)} title="Account">
        ⚓ Alltrexx {gebruiker && <span className="logo-ingelogd">●</span>}
      </button>

      {/* ── Beheerdersbalk ───────────────────────────────────────────── */}
      {gebruiker?.isBeheerder && (
        <div className="beheer-balk">
          <span className="beheer-titel">🛠️ Beheer</span>
          <button>🔍 Data zoeken</button>
          <button>✏️ Gegevens aanpassen</button>
          <button>📊 Rapportages</button>
          <button>👥 Gebruikers</button>
          <button>⚙️ Instellingen</button>
        </div>
      )}

      {open && (
        <div className="account-paneel">
          {gebruiker ? (
            <>
              <div className="account-kop">👤 {gebruiker.naam}</div>
              {gebruiker.email && <div className="account-email">{gebruiker.email}</div>}
              {gebruiker.isBeheerder && <div className="account-rol">🛠️ Beheerder</div>}
              <div className="account-info">
                Je gegevens en tracks staan veilig in jouw eigen Apple iCloud (CloudKit).
                Deze site slaat zelf géén persoonsgegevens op.
              </div>
              <button className="account-knop account-uitlog" onClick={uitloggen}>
                Uitloggen
              </button>
            </>
          ) : (
            <>
              <div className="account-kop">Inloggen of registreren</div>
              <div className="account-info">
                Log in met je Apple ID. Nieuw? Registreren gebeurt automatisch bij je
                eerste login. Alle accountgegevens en trackdata worden uitsluitend
                opgeslagen in Apple CloudKit — niet op deze website.
              </div>

              {/* AVG / GDPR toestemming */}
              <label className="consent-rij">
                <input type="checkbox" checked={akkoordNoodzakelijk}
                  onChange={e => setAkkoordNoodzakelijk(e.target.checked)} />
                <span>
                  Ik ga akkoord met de <button className="link-knop"
                    onClick={() => setPrivacyOpen(!privacyOpen)}>privacyverklaring</button> en
                  de verwerking die noodzakelijk is om in te loggen (verplicht)
                </span>
              </label>
              <label className="consent-rij">
                <input type="checkbox" checked={akkoordStatistiek}
                  onChange={e => setAkkoordStatistiek(e.target.checked)} />
                <span>Anonieme statistieken om de app te verbeteren (optioneel)</span>
              </label>

              {privacyOpen && (
                <div className="privacy-tekst">
                  <strong>Privacyverklaring (AVG / GDPR)</strong>
                  <ul>
                    <li><strong>Wat:</strong> Apple ID-identiteit (naam, e-mail) en je trackdata
                      (posities van boot, fiets, auto, vliegtuig of wandeling).</li>
                    <li><strong>Waar:</strong> uitsluitend in Apple CloudKit. Deze website en
                      onze server slaan géén accounts of persoonsgegevens op.</li>
                    <li><strong>Grondslag:</strong> jouw toestemming (art. 6 lid 1a AVG) en
                      uitvoering van de dienst (art. 6 lid 1b AVG).</li>
                    <li><strong>Bewaartermijn:</strong> zolang je account bestaat; je kunt alles
                      zelf wissen via je iCloud of door je account te verwijderen.</li>
                    <li><strong>Jouw rechten:</strong> inzage, rectificatie, wissing
                      ("recht op vergetelheid"), beperking, dataportabiliteit en bezwaar
                      (art. 15–21 AVG). Mail naar de beheerder om ze uit te oefenen.</li>
                    <li><strong>Doorgifte:</strong> Apple verwerkt data conform het
                      EU-VS Data Privacy Framework; voor EU-gebruikers gelden de
                      EU-standaardbepalingen.</li>
                    <li><strong>Klacht:</strong> je kunt altijd terecht bij de Autoriteit
                      Persoonsgegevens (NL) of jouw nationale toezichthouder.</li>
                    <li><strong>Toestemming intrekken</strong> kan op elk moment door uit te
                      loggen en je gegevens te wissen.</li>
                  </ul>
                </div>
              )}

              {/* CloudKit JS tekent hier zelf de officiële Apple-knop */}
              <div id="apple-sign-in-button" className="apple-knop-houder"
                style={{ display: akkoordNoodzakelijk ? 'block' : 'none' }} />
              {!akkoordNoodzakelijk && (
                <div className="account-hint">Vink eerst de privacyverklaring aan.</div>
              )}
              {bezig && <div className="account-hint">Apple-knop laden…</div>}
              {fout && <div className="account-fout">⚠️ {fout}</div>}
            </>
          )}
        </div>
      )}
    </>
  );
}
