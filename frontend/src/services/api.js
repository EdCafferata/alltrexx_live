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

/** Stuur positie vanuit app */
export const stuurPositie = (data, token) =>
  api.post('/trackers/positie', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
