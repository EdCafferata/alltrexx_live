import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

/** Haal alle live posities op */
export const getLiveKaart = () => api.get('/kaart/live').then(r => r.data);

/** Live posities per type */
export const getLivePerType = (type) =>
  api.get(`/kaart/live/${type}`).then(r => r.data);

/** Route van een tracker (laatste X uur) */
export const getRoute = (trackerId, uur = 24) =>
  api.get(`/kaart/route/${trackerId}`, { params: { uur } }).then(r => r.data);

/** Laatste update per databron (AISHUB, KPLER, ...) */
export const getBronnen = () => api.get('/kaart/bronnen').then(r => r.data);

/** Stuur positie vanuit app */
export const stuurPositie = (data, token) =>
  api.post('/trackers/positie', data, {
    headers: { Authorization: `Bearer ${token}` }
  });

// ── Beheer (admin-key in header X-Admin-Key) ────────────────────────────────
const adminHeaders = (key) => ({ headers: { 'X-Admin-Key': key } });

/** Alle trackers ophalen (beheer) */
export const adminGetTrackers = (key) =>
  api.get('/admin/trackers', adminHeaders(key)).then(r => r.data);

/** Boot toevoegen/bijwerken (upsert op AIS-nummer) */
export const adminSaveTracker = (key, tracker) =>
  api.post('/admin/trackers', tracker, adminHeaders(key)).then(r => r.data);

/** Tracker verwijderen */
export const adminDeleteTracker = (key, id) =>
  api.delete(`/admin/trackers/${id}`, adminHeaders(key));

/** Alle posities (track-historie) van een tracker wissen; de boot blijft bestaan */
export const adminWisPosities = (key, id) =>
  api.delete(`/admin/trackers/${id}/posities`, adminHeaders(key));

/** Zoek ICAO 24-bit hex bij een vliegtuigregistratie (bv. PH-USN) */
export const adminZoekIcao = (key, reg) =>
  api.get('/admin/vliegtuig/icao', { params: { reg }, headers: { 'X-Admin-Key': key } }).then(r => r.data);
