/**
 * Application Configuration Module
 * Centralized API & Firebase Endpoint Settings
 */

export const CONFIG = {
  // Mode: "local_api" (Express Server) | "firebase_rtdb" (Firebase Realtime Database)
  MODE: "firebase_rtdb",

  FIREBASE: {
    PROJECT_ID: "awdf-ba2b7",
    COLLECTION: "tasks",
    RTDB_BASE_URL: "https://awdf-ba2b7-default-rtdb.firebaseio.com",
  },

  LOCAL_API: {
    BASE_URL: "http://localhost:5000",
    ENDPOINT_PATH: "/data/RRtc9VpCYGqGScXzitZ5",
  },
};

/**
 * Returns the endpoint URL for tasks
 */
export const getApiEndpoint = (id = "") => {
  if (CONFIG.MODE === "firebase_rtdb") {
    const basePath = `${CONFIG.FIREBASE.RTDB_BASE_URL}/${CONFIG.FIREBASE.COLLECTION}`;
    return id ? `${basePath}/${id}.json` : `${basePath}.json`;
  } else {
    const basePath = `${CONFIG.LOCAL_API.BASE_URL}${CONFIG.LOCAL_API.ENDPOINT_PATH}`;
    return id ? `${basePath}/${id}` : basePath;
  }
};

export default CONFIG;
