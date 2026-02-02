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

const getEnvBaseUrl = (): string =>
  import.meta.env.VITE_API_URL ??
  (typeof window !== "undefined" ? `${window.location.origin}/api` : "");

export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

const getTokens = (): Tokens | null => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined;
  if (!accessToken) return null;
  return { access: accessToken, refresh: refreshToken };
};

const COOKIE_MAX_AGE_DAYS = 365;

function setAccessTokenCookie(access: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${ACCESS_TOKEN_KEY}=${encodeURIComponent(access)}; path=/; max-age=${COOKIE_MAX_AGE_DAYS * 86400}; SameSite=Strict`;
}

function clearAccessTokenCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; SameSite=Strict`;
}

export const saveTokens = (tokens: Tokens) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  if (tokens.refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }
  setAccessTokenCookie(tokens.access);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  clearAccessTokenCookie();
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
  timeout: 3000000, // 3000 seconds (50 min) default API timeout
});

/**
 * Refresh handling
 */
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

const processQueue = (_error: Error | null, token: string | null = null) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

const refreshToken = async (
  refreshTokenValue?: string
): Promise<RefreshResponse> => {
  // Django SimpleJWT expects body: { refresh: "<token>" }
  const res = await axios.post<RefreshResponse>(
    `${getEnvBaseUrl().replace(/\/$/, "")}/token/refresh/`,
    { refresh: refreshTokenValue },
    { headers: { "Content-Type": "application/json" } }
  );
  return res.data;
};

/**
 * Share token for shareable report links (no JWT required when this is set).
 */
export const getShareToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { __SHARE_TOKEN__?: string };
  return w.__SHARE_TOKEN__ ?? null;
};

/** JWT payload shape (custom claims: role, groups from backend). */
export type JwtPayload = {
  exp?: number;
  iat?: number;
  jti?: string;
  token_type?: string;
  user_id?: number;
  username?: string;
  role?: string;
  groups?: string[];
};

/**
 * Decode JWT payload without verification (client-side; we trust our own API).
 * Returns role and groups for RBAC. Default role "user" if missing.
 */
export function getJwtPayload(): JwtPayload | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!raw) return null;
  try {
    const parts = raw.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Role from JWT; "admin" or "user". Use for UI and gating. */
export function getRoleFromToken(): string {
  const p = getJwtPayload();
  return (p?.role && typeof p.role === "string" ? p.role : "user").toLowerCase();
}

/** Groups from JWT (e.g. ["Admin"]). */
export function getGroupsFromToken(): string[] {
  const p = getJwtPayload();
  if (Array.isArray(p?.groups)) return p.groups;
  return [];
}

/** True if JWT has role admin or Admin group. */
export function isAdminFromToken(): boolean {
  const role = getRoleFromToken();
  const groups = getGroupsFromToken();
  return role === "admin" || groups.some((g) => String(g).toLowerCase() === "admin");
}

/**
 * Request interceptor: attach JWT or X-Share-Token for share links
 */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const shareToken = getShareToken();
  if (shareToken && config.headers) {
    config.headers["X-Share-Token"] = shareToken;
  }
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
