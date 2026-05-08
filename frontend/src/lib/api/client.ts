import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import type { TokenPair } from "./types";
// Circular dep (client → auth-store → auth → client) is safe: useAuthStore
// is only accessed inside callbacks, never during module initialisation.
import { useAuthStore } from "@/stores/auth-store";

// Interceptor-free instance used for refresh calls and public endpoints
export const rawClient = axios.create({
  baseURL: "/api",
  withCredentials: false,
});

// Main client — request/response interceptors attached below
export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: false,
});

// Request interceptor: attach Bearer token from store
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Singleton promise while a token refresh is in flight
let refreshPromise: Promise<void> | null = null;

// Response interceptor: on 401, attempt one refresh-and-retry
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;
    const url: string = originalRequest.url ?? "";

    if (
      status !== 401 ||
      originalRequest._retry ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/login")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const refreshToken = useAuthStore.getState().refreshToken;
          if (!refreshToken) throw new Error("No refresh token");

          const resp = await rawClient.post<TokenPair>("/auth/refresh", {
            refresh_token: refreshToken,
          });
          useAuthStore.getState().setTokens(resp.data);
        } catch {
          useAuthStore.getState().clear();
          throw error;
        } finally {
          refreshPromise = null;
        }
      })();
    }

    try {
      await refreshPromise;
      const newToken = useAuthStore.getState().accessToken;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      return apiClient(originalRequest);
    } catch {
      return Promise.reject(error);
    }
  }
);
