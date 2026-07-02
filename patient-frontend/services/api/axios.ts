import axios from "axios";
import { getCookie } from "cookies-next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 s hard limit — prevents requests hanging forever on slow networks
  headers: {
    "Content-Type": "application/json",
  },
});

// ---- Request Interceptor: attach JWT ----
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("healthflow-access-token") ||
        getCookie("healthflow-access-token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Track in-flight token refresh so concurrent 401s don't each trigger
// their own refresh request (race condition fix).
let _refreshPromise: Promise<string> | null = null;

// ---- Response Interceptor: handle 401 / retry / normalize errors ----
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── 401 handling: refresh token once, then replay ──────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!_refreshPromise) {
          const refreshToken = localStorage.getItem("healthflow-refresh-token");
          if (!refreshToken) throw new Error("No refresh token");

          _refreshPromise = axios
            .post(`${API_URL}/auth/refresh`, { refreshToken })
            .then((res) => {
              const token = res.data.data.accessToken;
              localStorage.setItem("healthflow-access-token", token);
              return token;
            })
            .finally(() => {
              _refreshPromise = null;
            });
        }

        const newToken = await _refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch {
        _refreshPromise = null;
        if (typeof window !== "undefined") {
          localStorage.removeItem("healthflow-access-token");
          localStorage.removeItem("healthflow-refresh-token");
          window.location.href = "/login";
        }
      }
    }

    // ── Network error / timeout: one automatic retry for GET requests ──
    const isNetworkOrTimeout =
      !error.response || error.code === "ECONNABORTED";
    if (
      isNetworkOrTimeout &&
      originalRequest.method === "get" &&
      !originalRequest._retried
    ) {
      originalRequest._retried = true;
      // Wait 800 ms before retrying to let transient glitches settle
      await new Promise((r) => setTimeout(r, 800));
      return axiosInstance(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
