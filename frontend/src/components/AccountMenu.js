import React, { useState, useEffect } from 'react';
import { startLogin, logUit, huidigeGebruiker } from '../services/cloudkit';
import { maakGratisSleutel, aanmeldenGebruiker } from '../services/api';
import BeheerBoten from './BeheerBoten';
import BeheerGebruikers from './BeheerGebruikers';
import DataZoeken from './DataZoeken';
import Rapportages from './Rapportages';
import Instellingen from './Instellingen';
import Logboek from './Logboek';
import './AccountMenu.css';

// ── Logo-knop linksboven: account, login/registratie (CloudKit) en beheer ────
export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [gebruiker, setGebruiker] = useState(null);
  const [fout, setFout] = useState(null);
  const [bezig, setBezig] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [botenOpen, setBotenOpen] = useState(false);
  const [logboekOpen, setLogboekOpen] = useState(false);
  const [gebruikersOpen, setGebruikersOpen] = useState(false);
  const [dataZoekenOpen, setDataZoekenOpen] = useState(false);
  const [rapportagesOpen, setRapportagesOpen] = useState(false);
  const [instellingenOpen, setInstellingenOpen] = useState(false);

  // Inlogsleutel (token) voor de mobiele app — eerder aangemaakt? uit localStorage.
  const [sleutel, setSleutel] = useState(() => {
    try { return JSON.parse(localStorage.getItem('alltrexx-sleutel')); }
    catch { return null; }
  });
  const [sleutelBezig, setSleutelBezig] = useState(false);
  const [sleutelFout, setSleutelFout] = useState(null);
  const [gekopieerd, setGekopieerd] = useState(false);

  // AVG-toestemmingen
  const [akkoordNoodzakelijk, setAkkoordNoodzakelijk] = useState(false);
  const [akkoordStatistiek, setAkkoordStatistiek] = useState(false);

  // Meld de CloudKit-gebruiker aan bij de backend en verrijk met abonnement (FREE/PRO).
  // Faalt de backend, dan tonen we de gebruiker toch (zonder Pro-opties).
  const koppelAbonnement = (g) => {
    if (!g) { setGebruiker(null); return; }
    aanmeldenGebruiker(g.userRecordName, g.naam, g.isBeheerder)
      .then(u => setGebruiker({ ...g, abonnement: u.abonnement }))
      .catch(() => setGebruiker({ ...g, abonnement: 'FREE' }));
  };

  useEffect(() => { huidigeGebruiker().then(koppelAbonnement); /* eslint-disable-next-line */ }, []);

  // Zodra het verplichte vinkje aan staat: CloudKit laten tekenen in
  // #apple-sign-in-button en wachten tot de gebruiker daarmee inlogt.
  useEffect(() => {
    if (!akkoordNoodzakelijk || gebruiker) return;
    setFout(null); setBezig(true);
    startLogin()
      .then(g => {
        koppelAbonnement(g);
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

  // Gratis inlogsleutel aanmaken (token voor de mobiele app). De gebruiker bewaart
  // 'm zelf; we cachen 'm lokaal zodat hij na herladen zichtbaar blijft.
  const maakSleutel = async () => {
    setSleutelFout(null); setSleutelBezig(true);
    try {
      const naam = gebruiker?.naam ? `${gebruiker.naam} (app)` : 'Mijn tracker';
      const t = await maakGratisSleutel(naam);
      setSleutel(t);
      localStorage.setItem('alltrexx-sleutel', JSON.stringify(t));
    } catch (e) {
      setSleutelFout(e?.response?.data?.message || e.message || 'Aanmaken mislukt');
    } finally { setSleutelBezig(false); }
  };

  const kopieerSleutel = async () => {
    try {
      await navigator.clipboard.writeText(sleutel.token);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 1800);
    } catch { /* clipboard niet beschikbaar — gebruiker selecteert handmatig */ }
  };

  // Pro (of beheerder) ontgrendelt alle beheer-/kijk-opties; Free krijgt alleen het logboek.
  const isPro = gebruiker?.abonnement === 'PRO' || gebruiker?.isBeheerder;

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
              <div className="account-rol-rij">
                <span className={'account-abo ' + (isPro ? 'pro' : 'free')}>
                  {isPro ? '⭐ PRO' : 'FREE'}
                </span>
                {gebruiker.isBeheerder && <span className="account-rol">🛠️ Beheerder</span>}
              </div>
              <div className="account-info">
                Je gegevens en tracks staan veilig in jouw eigen Apple iCloud (CloudKit).
                De server bewaart alleen een account-ID, je naam als label en je
                abonnementsstatus — geen e-mail of trackdata.
              </div>

              {/* Inlogsleutel voor de mobiele app: gratis (token) of Pro (binnenkort) */}
              <div className="sleutel-sectie">
                <div className="sleutel-titel">🔑 Inlogsleutel voor de app</div>
                {sleutel ? (
                  <div className="sleutel-box">
                    <div className="sleutel-label">Jouw gratis sleutel ({sleutel.naam}):</div>
                    <code className="sleutel-token">{sleutel.token}</code>
                    <button className="account-knop" onClick={kopieerSleutel}>
                      {gekopieerd ? '✅ Gekopieerd' : '📋 Sleutel kopiëren'}
                    </button>
                    <div className="account-info">
                      Vul deze sleutel in de Alltrexx-app in om je positie te delen.
                    </div>
                  </div>
                ) : (
                  <>
                    <button className="account-knop" disabled={sleutelBezig} onClick={maakSleutel}>
                      {sleutelBezig ? 'Aanmaken…' : '🆓 Gratis sleutel aanmaken'}
                    </button>
                    <div className="sleutel-uitleg">
                      Alleen je eigen voertuig &amp; data · logboek (binnenkort)
                    </div>
                    <button className="account-knop sleutel-pro" disabled
                            title="Binnenkort beschikbaar">
                      ⭐ Pro-sleutel <span className="sleutel-badge">binnenkort</span>
                    </button>
                    <div className="sleutel-uitleg">
                      Alle voertuigen &amp; beheer-opties · onbeperkt oproepen
                    </div>
                    {sleutelFout && <div className="account-fout">⚠️ {sleutelFout}</div>}
                  </>
                )}
              </div>

              {/* Logboeken: voor iedereen (Free = eigen data). Pro/beheer-opties eronder
                  alleen voor PRO/beheerder; echte toegang blijft afgeschermd via de admin-key. */}
              <div className="beheer-sectie">
                <button className="account-knop" onClick={() => setLogboekOpen(!logboekOpen)}>
                  📖 Logboeken
                </button>
                {logboekOpen && <Logboek />}

                {isPro ? (
                  <>
                    <button className="account-knop" onClick={() => { setBotenOpen(true); setOpen(false); }}>🛰️ Alle data beheren</button>
                    <button className="account-knop" onClick={() => { setDataZoekenOpen(true); setOpen(false); }}>🔍 Data zoeken</button>
                    <button className="account-knop" onClick={() => { setRapportagesOpen(true); setOpen(false); }}>📊 Rapportages</button>
                    <button className="account-knop" onClick={() => { setGebruikersOpen(true); setOpen(false); }}>👥 Gebruikers</button>
                    <button className="account-knop" onClick={() => { setInstellingenOpen(true); setOpen(false); }}>⚙️ Instellingen</button>
                  </>
                ) : (
                  <div className="sleutel-uitleg">
                    ⭐ Pro ontgrendelt alle voertuigen &amp; beheer-opties — binnenkort.
                  </div>
                )}
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
                eerste login. Je trackdata staat in Apple CloudKit; de server bewaart
                alleen een account-ID, je naam als label en je abonnement (FREE/PRO).
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
                    <li><strong>Waar:</strong> je trackdata staat in Apple CloudKit. Onze
                      server bewaart alleen een account-ID, je naam als label en je
                      abonnementsstatus (FREE/PRO) — geen e-mail of trackdata.</li>
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
      {gebruikersOpen && <BeheerGebruikers onSluiten={() => setGebruikersOpen(false)} />}
      {dataZoekenOpen && <DataZoeken onSluiten={() => setDataZoekenOpen(false)} />}
      {rapportagesOpen && <Rapportages onSluiten={() => setRapportagesOpen(false)} />}
      {instellingenOpen && <Instellingen onSluiten={() => setInstellingenOpen(false)} />}
    </>
  );
}
