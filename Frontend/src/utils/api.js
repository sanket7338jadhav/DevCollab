// Central API configuration (uses Vite env with fallback)
const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5000/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) =>
    fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handleResponse),

  login: (data) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handleResponse),

  me: () =>
    fetch(`${BASE_URL}/auth/me`, {
      headers: { ...getAuthHeader() },
    }).then(handleResponse),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const userAPI = {
  getAll: () =>
    fetch(`${BASE_URL}/users`, {
      headers: { ...getAuthHeader() },
    }).then(handleResponse),

  getById: (id) =>
    fetch(`${BASE_URL}/users/${id}`, {
      headers: { ...getAuthHeader() },
    }).then(handleResponse),

  updateProfile: (data) =>
    fetch(`${BASE_URL}/users/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(data),
    }).then(handleResponse),
};

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projectAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/projects${qs ? `?${qs}` : ""}`, {
      headers: { ...getAuthHeader() },
    }).then(handleResponse);
  },

  getMy: () =>
    fetch(`${BASE_URL}/projects/my`, {
      headers: { ...getAuthHeader() },
    }).then(handleResponse),

  getById: (id) =>
    fetch(`${BASE_URL}/projects/${id}`, {
      headers: { ...getAuthHeader() },
    }).then(handleResponse),

  create: (data) =>
    fetch(`${BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(data),
    }).then(handleResponse),

  update: (id, data) =>
    fetch(`${BASE_URL}/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (id) =>
    fetch(`${BASE_URL}/projects/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() },
    }).then(handleResponse),
};

// ─── Requests ─────────────────────────────────────────────────────────────────
export const requestAPI = {
  send: (data) =>
    fetch(`${BASE_URL}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(data),
    }).then(handleResponse),

  getIncoming: () =>
    fetch(`${BASE_URL}/requests/incoming`, {
      headers: { ...getAuthHeader() },
    }).then(handleResponse),

  getSent: () =>
    fetch(`${BASE_URL}/requests/sent`, {
      headers: { ...getAuthHeader() },
    }).then(handleResponse),

  handle: (id, action) =>
    fetch(`${BASE_URL}/requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ action }),
    }).then(handleResponse),
};

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messageAPI = {
  getConversations: () =>
    fetch(`${BASE_URL}/messages/conversations`, {
      headers: { ...getAuthHeader() },
    }).then(handleResponse),

  getMessages: (userId) =>
    fetch(`${BASE_URL}/messages/${userId}`, {
      headers: { ...getAuthHeader() },
    }).then(handleResponse),

  send: (data) =>
    fetch(`${BASE_URL}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(data),
    }).then(handleResponse),
};
