// Peptide IMS — Frontend API Client

const API = '/api';
const TOKEN_KEY = 'pims_token';
const USER_KEY = 'pims_user';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({ error: 'Request failed' }));

  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

// ── Auth ──────────────────────────────────────────

export async function login(username, password) {
  const data = await request('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  setToken(data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export function logout() {
  // Fire-and-forget server-side logout
  const token = getToken();
  if (token) {
    fetch(`${API}/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => {});
  }
  clearToken();
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Data ──────────────────────────────────────────

export async function loadData() {
  return request('/data');
}

// ── Groups ────────────────────────────────────────

export async function createGroup({ name, description }) {
  return request('/groups', {
    method: 'POST',
    body: JSON.stringify({ name, description })
  });
}

export async function updateGroup(id, { name, description }) {
  return request(`/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, description })
  });
}

export async function deleteGroup(id) {
  return request(`/groups/${id}`, { method: 'DELETE' });
}

// ── Items ─────────────────────────────────────────

export async function createItem({ groupId, name, sku, qty, unit, lowStockThreshold, costPrice, salePrice }) {
  return request('/items', {
    method: 'POST',
    body: JSON.stringify({ groupId, name, sku, qty, unit, lowStockThreshold, costPrice, salePrice })
  });
}

export async function updateItem(id, fields) {
  return request(`/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fields)
  });
}

export async function deleteItem(id) {
  return request(`/items/${id}`, { method: 'DELETE' });
}

export async function adjustStock(itemId, delta, note) {
  return request('/items/adjust', {
    method: 'POST',
    body: JSON.stringify({ itemId, delta, note })
  });
}

// ── Invoices ──────────────────────────────────────

export async function createInvoice(payload) {
  return request('/invoices', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateInvoice(id, payload) {
  return request(`/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteInvoice(id) {
  return request(`/invoices/${id}`, { method: 'DELETE' });
}

export async function updateInvoiceStatus(id, status) {
  return request(`/invoices/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}

// ── Settings (synced across devices) ─────────────

export async function getSettings() {
  return request('/settings');
}

export async function putSettings(data) {
  return request('/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}
