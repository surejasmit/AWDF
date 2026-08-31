/**
 * API Configuration for Task Management Application
 */

export const CONFIG = {
  // Backend Express + MongoDB API
  API_BASE_URL: "http://localhost:5000",
  AUTH_ENDPOINTS: {
    REGISTER: "http://localhost:5000/auth/register",
    LOGIN: "http://localhost:5000/auth/login",
    ME: "http://localhost:5000/auth/me",
  },
  TASKS_ENDPOINT: "http://localhost:5000/tasks",
  
  // Firebase fallback if needed
  FIREBASE: {
    PROJECT_ID: "awdf-ba2b7",
    RTDB_BASE_URL: "https://awdf-ba2b7-default-rtdb.firebaseio.com",
    COLLECTION: "tasks",
  },
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
