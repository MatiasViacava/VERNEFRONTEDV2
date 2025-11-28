// src/lib/api.js
const API_URL = import.meta.env.VITE_API_URL || "https://vernebackendv1.onrender.com";

export function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Bajo nivel (devuelve Response)
export async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...authHeader(),
    ...(options.headers || {}),
  };
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

// Alto nivel (parsea JSON y lanza error si !ok)
async function handle(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).detail || (await res.text()) || msg; } catch { 
        /* ignorar error al parsear */
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  // si no hay body, evita error al parsear
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const api = {
  get:  (path)             => apiFetch(path).then(handle),
  post: (path, body)       => apiFetch(path, { method: "POST", body: JSON.stringify(body) }).then(handle),
  put:  (path, body)       => apiFetch(path, { method: "PUT",  body: JSON.stringify(body) }).then(handle),
  del:  (path)             => apiFetch(path, { method: "DELETE" }).then(handle),

  // Subir archivos (no fijar Content-Type)
  upload: (path, formData) =>
    fetch(`${API_URL}${path}`, { method: "POST", headers: authHeader(), body: formData }).then(handle),

  // Descargar binarios (ej. CSV/plantillas)
  getBlob: async (path) => {
    const res = await fetch(`${API_URL}${path}`, { headers: authHeader() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.blob();
  },
};

export { API_URL };