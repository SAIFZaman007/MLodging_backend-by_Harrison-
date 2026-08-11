import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export const apiClient = axios.create({ baseURL, timeout: 15000 });

const ACCESS_TOKEN_KEY = "8888_dashboard_access_token";
const REFRESH_TOKEN_KEY = "8888_dashboard_refresh_token";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post(`${baseURL}/auth/refresh`, { refresh_token: refreshToken });
    tokenStorage.set(data.access_token, data.refresh_token);
    return data.access_token as string;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error?.response?.status === 401 && !original._retry) {
      original._retry = true;
      refreshPromise ??= refreshAccessToken();
      const newToken = await refreshPromise;
      refreshPromise = null;

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
      // Refresh failed — force back to login.
      window.location.href = "/login";
    }

    const message = error?.response?.data?.detail ?? error?.message ?? "Something went wrong.";
    return Promise.reject(new Error(typeof message === "string" ? message : "Request failed"));
  },
);
