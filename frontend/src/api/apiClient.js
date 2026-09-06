import axios from 'axios';

const TOKEN_STORAGE_KEY = 'markpulse_token';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage can be unavailable (private mode, etc.) — auth still
    // works for the current in-memory session via AuthContext.
  }
}

const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api`,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 means the session is gone (missing/expired/invalid token) —
// clear it and let the app redirect to /login rather than showing a
// confusing error inline. AuthContext listens for this event.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setStoredToken(null);
      window.dispatchEvent(new CustomEvent('markpulse:unauthorized'));
    }
    return Promise.reject(normalizeError(error));
  }
);

/** Extracts a safe, user-facing message from any API failure — network, timeout, or server error. */
export function normalizeError(error) {
  if (error.response) {
    const body = error.response.data;
    return {
      status: error.response.status,
      code: body?.code,
      message: body?.message || 'Something went wrong. Please try again.',
    };
  }
  if (error.request) {
    return { status: 0, code: 'NETWORK_ERROR', message: "You're offline. Showing the last available data." };
  }
  return { status: 0, code: 'CLIENT_ERROR', message: error.message || 'Something went wrong.' };
}

export default apiClient;
