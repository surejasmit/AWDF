/**
 * Centralized API Service for Frontend Application
 * Interacts directly with Express + MongoDB backend
 */
import { CONFIG, getApiEndpoint } from "../config/config";

const getHeaders = (includeAuth = true) => {
  const headers = {
    "Content-Type": "application/json",
  };
  if (includeAuth) {
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
};

// Check if response is 401 and handle session expiry
const checkAuthError = (status) => {
  if (status === 401) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    window.dispatchEvent(new Event("auth_change"));
  }
};

export const authService = {
  async register(name, email, password) {
    const res = await fetch(CONFIG.AUTH_ENDPOINTS.REGISTER, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    return data;
  },

  async login(email, password) {
    const res = await fetch(CONFIG.AUTH_ENDPOINTS.LOGIN, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    return data;
  },

  async getMe() {
    const res = await fetch(CONFIG.AUTH_ENDPOINTS.ME, {
      headers: getHeaders(true),
    });
    checkAuthError(res.status);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch profile");
    return data;
  },
};

export const taskService = {
  async getTasks() {
    const res = await fetch(getApiEndpoint(), {
      headers: getHeaders(true),
    });
    checkAuthError(res.status);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch tasks");
    return data;
  },

  async createTask(title) {
    const res = await fetch(getApiEndpoint(), {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify({ title }),
    });
    checkAuthError(res.status);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create task");
    return data;
  },

  async updateTask(id, updates) {
    const res = await fetch(getApiEndpoint(id), {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(updates),
    });
    checkAuthError(res.status);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update task");
    return data;
  },

  async deleteTask(id) {
    const res = await fetch(getApiEndpoint(id), {
      method: "DELETE",
      headers: getHeaders(true),
    });
    checkAuthError(res.status);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete task");
    return data;
  },
};
