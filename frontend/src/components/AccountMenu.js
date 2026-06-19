import React, { useState, useEffect } from 'react';
import { startLogin, logUit, huidigeGebruiker } from '../services/cloudkit';
import BeheerBoten from './BeheerBoten';
import './AccountMenu.css';

// ── Logo-knop linksboven: account, login/registratie (CloudKit) en beheer ────
export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [gebruiker, setGebruiker] = useState(null);
  const [fout, setFout] = useState(null);
  const [bezig, setBezig] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [botenOpen, setBotenOpen] = useState(false);

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
      <button className="login-knop" onClick={() => setOpen(!open)}
              title={gebruiker ? 'Account' : 'Inloggen met Apple'}
              aria-label={gebruiker ? 'Account' : 'Inloggen met Apple'}>
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path fill="#111" d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.23 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.03 2.29-1.27 3.14-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.72-1.04-2.75-4.13zM14.6 4.6c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-2.99 1.54-.66.76-1.23 1.98-1.08 3.15 1.14.09 2.3-.58 3.01-1.44z"/>
        </svg>
        {gebruiker && <span className="login-ingelogd" />}
      </button>

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

              {/* Beheer-sectie onder het inlog-gedeelte. CloudKit geeft het e-mailadres
                  meestal niet vrij, dus we tonen 'm voor elke ingelogde gebruiker; de
                  echte toegang wordt afgeschermd door de admin-key op de backend. */}
              {gebruiker && (
                <div className="beheer-sectie">
                  <div className="beheer-titel">🛠️ Beheer</div>
                  <button className="account-knop" onClick={() => { setBotenOpen(true); setOpen(false); }}>🛰️ Alle data beheren</button>
                  <button className="account-knop">🔍 Data zoeken</button>
                  <button className="account-knop">📊 Rapportages</button>
                  <button className="account-knop">👥 Gebruikers</button>
                  <button className="account-knop">⚙️ Instellingen</button>
                </div>
              )}

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

      {botenOpen && <BeheerBoten onSluiten={() => setBotenOpen(false)} />}
    </>
  );
}
