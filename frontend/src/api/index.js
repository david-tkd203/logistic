import axios from "axios";

// Detectar entorno: Capacitor (APK) vs navegador
function detectBaseURL() {
  // 1. Variable de entorno explicita (prioridad)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Capacitor en emulador (10.0.2.2 = host desde emulador)
  try {
    if (window.Capacitor?.isNativePlatform()) {
      return "http://10.0.2.2:8000/api";
    }
  } catch {}

  // 3. Navegador normal: usa nginx proxy (Docker) o Vite proxy
  return "/api";
}

const api = axios.create({
  baseURL: detectBaseURL(),
  timeout: 15000,
});

export default api;

// ── Helpers ──────────────────────────────────────────────────────────────
export const fetchAll = async (endpoint, params = {}) => {
  const { data } = await api.get(endpoint, { params });
  return data.results ?? data;
};

export const fetchOne = async (endpoint, id) => {
  const { data } = await api.get(`${endpoint}${id}/`);
  return data;
};

export const createItem = async (endpoint, body) => {
  const { data } = await api.post(endpoint, body);
  return data;
};

export const updateItem = async (endpoint, id, body) => {
  const { data } = await api.patch(`${endpoint}${id}/`, body);
  return data;
};

export const deleteItem = async (endpoint, id) => {
  await api.delete(`${endpoint}${id}/`);
};

// ── Formateo CLP ───────────────────────────────────────────────────────
export const formatCLP = (value) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value || 0);

export const formatCLPDec = (value) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
