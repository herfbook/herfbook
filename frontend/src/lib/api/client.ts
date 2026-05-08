import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import type { TokenPair } from "./types";

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

// Lazy-import the store to avoid circular deps at module init
function getAuthStore() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@/stores/auth-store").useAuthStore;
}

// Request interceptor: attach Bearer token from store
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthStore().getState().accessToken as string | null;
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
          const store = getAuthStore();
          const refreshToken = store.getState().refreshToken as string | null;
          if (!refreshToken) throw new Error("No refresh token");

          const resp = await rawClient.post<TokenPair>("/auth/refresh", {
            refresh_token: refreshToken,
          });
          store.getState().setTokens(resp.data);
        } catch {
          getAuthStore().getState().clear();
          throw error;
        } finally {
          refreshPromise = null;
        }
      })();
    }

    try {
      await refreshPromise;
      const newToken = getAuthStore().getState().accessToken as string | null;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      return apiClient(originalRequest);
    } catch {
      return Promise.reject(error);
    }
  }
);
