/**
 * API Configuration for Task Management Application
 * Pure REST API against Express + MongoDB Backend
 */

const resolveApiBase = () => {
  if (typeof import.meta === "undefined" || !import.meta.env) {
    return "http://localhost:5000";
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");
  }
  // Production builds default to same-origin /api (nginx reverse proxy -> backend),
  // which avoids CORS entirely.
  return import.meta.env.PROD ? "/api" : "http://localhost:5000";
};

const API_BASE = resolveApiBase();

export const CONFIG = {
  API_BASE_URL: API_BASE,
  HEALTH_ENDPOINT: `${API_BASE}/health`,
  AUTH_ENDPOINTS: {
    REGISTER: `${API_BASE}/auth/register`,
    LOGIN: `${API_BASE}/auth/login`,
    ME: `${API_BASE}/auth/me`,
  },
  TASKS_ENDPOINT: `${API_BASE}/tasks`,
};

/**
 * Gets Task API endpoint
 * @param {string} id - Optional task ID
 * @returns {string} Full URL
 */
export const getApiEndpoint = (id = "") => {
  return id ? `${CONFIG.TASKS_ENDPOINT}/${id}` : CONFIG.TASKS_ENDPOINT;
};

export default CONFIG;
