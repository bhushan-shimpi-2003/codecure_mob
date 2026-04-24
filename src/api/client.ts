import axios from "axios";
import { Storage } from "../utils/storage";

// ─── Constants ────────────────────────────────────────────────────────────────
export const API_BASE_URL = "https://codecure-acedamy.onrender.com";
export const API_URL = `${API_BASE_URL}/api`;
export const UPLOADS_URL = `${API_BASE_URL}/uploads`;

// ─── Axios Instance ───────────────────────────────────────────────────────────
const client = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ─── Request Interceptor – Attach Bearer Token ────────────────────────────────
client.interceptors.request.use(
  async (config) => {
    const token = await Storage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor – Global 401 Handler ───────────────────────────────
// We use a simple event pattern so the AuthContext can react to 401s
// without creating a circular import.
type LogoutListener = () => void;
let logoutListener: LogoutListener | null = null;

export const setLogoutListener = (fn: LogoutListener) => {
  logoutListener = fn;
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await Storage.deleteItem("auth_token");
      logoutListener?.();
    }
    return Promise.reject(error);
  }
);

export default client;
