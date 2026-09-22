/**
 * Thin fetch wrapper. Every call carries the demo role headers so the server
 * knows who is "logged in" - this is a role switcher, not authentication.
 *
 * The API is deployed separately from this client, so its origin comes from
 * VITE_API_URL at build time. Left unset (local development) the base is empty
 * and requests go to a relative /api path, which the Vite dev server proxies to
 * http://localhost:4000.
 */
export const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

/** Absolute URL for an API path - also used for plain links and downloads. */
export const apiUrl = (path) => API_BASE + '/api' + path;

const ROLE_KEY = 'linguaroute.role';

export function readRole() {
  try {
    const raw = localStorage.getItem(ROLE_KEY);
    return raw ? JSON.parse(raw) : { role: 'admin', bdId: null, name: 'Admin' };
  } catch {
    return { role: 'admin', bdId: null, name: 'Admin' };
  }
}

export function writeRole(role) {
  try {
    localStorage.setItem(ROLE_KEY, JSON.stringify(role));
  } catch {
    /* private browsing - the app still works, it just forgets the choice */
  }
}

async function request(path, options = {}) {
  const actor = readRole();
  const headers = { 'x-role': actor.role, ...(options.headers ?? {}) };
  if (actor.bdId) headers['x-bd-id'] = actor.bdId;
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(apiUrl(path), { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || 'Request failed (' + res.status + ')');
  return data;
}

export const api = {
  health: () => request('/health'),
  meta: () => request('/meta'),

  bds: () => request('/bds'),
  createBD: (body) => request('/bds', { method: 'POST', body: JSON.stringify(body) }),
  updateBD: (id, body) => request('/bds/' + id, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteBD: (id) => request('/bds/' + id, { method: 'DELETE' }),

  leads: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v != null),
    ).toString();
    return request('/leads' + (qs ? '?' + qs : ''));
  },
  createLead: (body) => request('/leads', { method: 'POST', body: JSON.stringify(body) }),
  matches: (id) => request('/leads/' + id + '/matches'),
  assign: (id, bdId) => request('/leads/' + id + '/assign', { method: 'POST', body: JSON.stringify({ bdId }) }),
  importCsv: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/leads/import', { method: 'POST', body: form });
  },

  runRouting: () => request('/assignments/run', { method: 'POST' }),
  queue: (bdId) => request('/queue/' + bdId),
  logCall: (body) => request('/calls', { method: 'POST', body: JSON.stringify(body) }),
  analytics: () => request('/analytics/summary'),
};

export default api;
