// ── Apple CloudKit koppeling ──────────────────────────────────────────────────
// Alle accounts en trackdata staan bij Apple (CloudKit), NIET op deze site/server.
// Configuratie via .env:
//   REACT_APP_CLOUDKIT_CONTAINER  bijv. iCloud.cafferata.info.alltrexx
//   REACT_APP_CLOUDKIT_API_TOKEN  aanmaken in CloudKit Dashboard → API Access
//   REACT_APP_CLOUDKIT_ENV        development | production

const CONTAINER = process.env.REACT_APP_CLOUDKIT_CONTAINER || 'iCloud.cafferata.info.alltrexx';
const API_TOKEN = process.env.REACT_APP_CLOUDKIT_API_TOKEN || '';
const OMGEVING  = process.env.REACT_APP_CLOUDKIT_ENV || 'development';

export const BEHEERDER_EMAIL = 'edcafferata@icloud.com';

let ckLaadPromise = null;

// CloudKit JS laden en configureren (eenmalig)
export function laadCloudKit() {
  if (ckLaadPromise) return ckLaadPromise;
  ckLaadPromise = new Promise((resolve, reject) => {
    if (!API_TOKEN) {
      reject(new Error('CloudKit nog niet geconfigureerd (REACT_APP_CLOUDKIT_API_TOKEN ontbreekt)'));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.apple-cloudkit.com/ck/2/cloudkit.js';
    script.onload = () => {
      window.CloudKit.configure({
        containers: [{
          containerIdentifier: CONTAINER,
          apiTokenAuth: { apiToken: API_TOKEN, persist: true },
          environment: OMGEVING,
        }],
      });
      resolve(window.CloudKit.getDefaultContainer());
    };
    script.onerror = () => reject(new Error('CloudKit JS kon niet geladen worden'));
    document.head.appendChild(script);
  });
  return ckLaadPromise;
}

// Inloggen met Apple ID. CloudKit JS rendert zélf een Apple-knop in de div
// met id "apple-sign-in-button" — die div moet bestaan vóór deze aanroep.
// Resolve't pas nadat de gebruiker via die knop is ingelogd.
export async function startLogin() {
  const container = await laadCloudKit();
  const identity = await container.setUpAuth(); // tekent de knop als uitgelogd
  if (identity) return identiteitNaarGebruiker(identity); // was al ingelogd
  const id = await container.whenUserSignsIn();
  return identiteitNaarGebruiker(id);
}

export async function logUit() {
  const container = await laadCloudKit();
  await container.signOut();
}

// Bij paginalading: kijk of er al een sessie is
export async function huidigeGebruiker() {
  try {
    const container = await laadCloudKit();
    const identity = await container.setUpAuth();
    return identity ? identiteitNaarGebruiker(identity) : null;
  } catch {
    return null;
  }
}

function identiteitNaarGebruiker(identity) {
  const naam = identity?.nameComponents
    ? `${identity.nameComponents.givenName || ''} ${identity.nameComponents.familyName || ''}`.trim()
    : null;
  const email = identity?.lookupInfo?.emailAddress || null;
  return {
    userRecordName: identity?.userRecordName,
    naam: naam || email || 'Apple-gebruiker',
    email,
    isBeheerder: email === BEHEERDER_EMAIL,
  };
}

// ── Trackdata opslaan in CloudKit (alle 5 typen) ─────────────────────────────
// Records van type 'Track' in de private database van de gebruiker.
export async function bewaarTrack({ trackerId, type, punten }) {
  const container = await laadCloudKit();
  const db = container.privateCloudDatabase;
  return db.saveRecords([{
    recordType: 'Track',
    fields: {
      trackerId: { value: trackerId },
      type:      { value: type },        // BOAT | BIKE | CAR | PLANE | PERSON
      punten:    { value: JSON.stringify(punten) },
      opgeslagen:{ value: Date.now() },
    },
  }]);
}

// ── Beheer (alleen beheerder): zoeken in de publieke database ────────────────
export async function zoekTracks({ type, vanaf } = {}) {
  const container = await laadCloudKit();
  const db = container.publicCloudDatabase;
  const filters = [];
  if (type)  filters.push({ fieldName: 'type', comparator: 'EQUALS', fieldValue: { value: type } });
  if (vanaf) filters.push({ fieldName: 'opgeslagen', comparator: 'GREATER_THAN', fieldValue: { value: vanaf } });
  const res = await db.performQuery({ recordType: 'Track', filterBy: filters });
  return res.records;
}
