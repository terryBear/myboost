/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

export type Tokens = {
  access: string;
  refresh?: string;
};

export type RefreshResponse = {
  access: string;
  refresh?: string;
};

const getEnvBaseUrl = (): string => import.meta.env.VITE_API_URL;

export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

const getTokens = (): Tokens | null => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined;
  if (!accessToken) return null;
  return { access: accessToken, refresh: refreshToken };
};

export const saveTokens = (tokens: Tokens) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  if (tokens.refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }
};

const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Axios instance
 */
const api: AxiosInstance = axios.create({
  baseURL: getEnvBaseUrl(),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30_000,
});

/**
 * Refresh handling
 */
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

const refreshToken = async (
  refreshTokenValue?: string
): Promise<RefreshResponse> => {
  // Adjust path/shape to your backend
  const res = await axios.post<RefreshResponse>(
    `${getEnvBaseUrl().replace(/\/$/, "")}/token/refresh/`,
    { refreshToken: refreshTokenValue },
    { headers: { "Content-Type": "application/json" } }
  );
  return res.data;
};

/**
 * Request interceptor: attach token
 */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const tokens = getTokens();
  if (tokens?.access && config.headers) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

/**
 * Response interceptor: handle 401 by attempting refresh
 */
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !(originalRequest as any)._retry
    ) {
      (originalRequest as any)._retry = true;

      const tokens = getTokens();
      if (!tokens?.refresh) {
        clearTokens();
        // Optionally redirect to login page:
        // window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api.request(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;
      try {
        const data = await refreshToken(tokens.refresh);
        saveTokens({
          access: data.access,
          refresh: data.refresh,
        });
        processQueue(null, data.access);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
        }
        return api.request(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        clearTokens();
        // Optionally redirect to login page:
        // window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Convenience helpers with generics
 */
export const request = <T = any>(config: AxiosRequestConfig) =>
  api.request<T>(config).then((r) => r.data);

export const get = <T = any>(url: string, config?: AxiosRequestConfig) =>
  api.get<T>(url, config).then((r) => r.data);

export const post = <T = any, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
) => api.post<T>(url, data, config).then((r) => r.data);

export const put = <T = any, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
) => api.put<T>(url, data, config).then((r) => r.data);

export const del = <T = any>(url: string, config?: AxiosRequestConfig) =>
  api.delete<T>(url, config).then((r) => r.data);

export default api;
