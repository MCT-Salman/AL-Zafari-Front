const LOGOUT_FLAG_KEY = "app:isLoggingOut";
const AUTH_STORAGE_KEY = "auth";
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const EXPIRES_AT_KEY = "authExpiresAt";

export const AUTH_SESSION_CHANGED_EVENT = "auth-session-changed";

const dispatchAuthSessionChanged = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_CHANGED_EVENT));
};

const decodeBase64Url = (value) => {
  if (!value || typeof window === "undefined") return null;

  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4;
    const padded = padding ? normalized + "=".repeat(4 - padding) : normalized;
    return window.atob(padded);
  } catch {
    return null;
  }
};

const parseJwtPayload = (token) => {
  if (!token || typeof token !== "string") return null;

  const [, payload] = token.split(".");
  if (!payload) return null;

  const decoded = decodeBase64Url(payload);
  if (!decoded) return null;

  try {
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const getTokenExpiryMs = (accessToken) => {
  const payload = parseJwtPayload(accessToken);
  const exp = Number(payload?.exp);
  return Number.isFinite(exp) && exp > 0 ? exp * 1000 : null;
};

export const resolveExpiresAt = ({ accessToken, expiresIn } = {}) => {
  const jwtExpiry = getTokenExpiryMs(accessToken);
  if (jwtExpiry) return jwtExpiry;

  const expiresInNumber = Number(expiresIn);
  if (Number.isFinite(expiresInNumber) && expiresInNumber > 0) {
    return Date.now() + expiresInNumber * 1000;
  }

  return null;
};

export const setLoggingOutFlag = (value) => {
  if (typeof window === "undefined") return;
  if (value) {
    window.sessionStorage.setItem(LOGOUT_FLAG_KEY, "1");
    return;
  }
  window.sessionStorage.removeItem(LOGOUT_FLAG_KEY);
};

export const isLoggingOut = () => {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(LOGOUT_FLAG_KEY) === "1";
};

export const storeAuthSession = ({ user, accessToken, refreshToken, expiresIn } = {}) => {
  if (typeof window === "undefined") return null;

  if (user) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }

  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  const expiresAt = resolveExpiresAt({ accessToken, expiresIn });
  if (expiresAt) {
    window.localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
  } else {
    window.localStorage.removeItem(EXPIRES_AT_KEY);
  }

  dispatchAuthSessionChanged();
  return expiresAt;
};

export const updateAccessToken = ({ accessToken, expiresIn } = {}) => {
  if (typeof window === "undefined" || !accessToken) return null;

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  const expiresAt = resolveExpiresAt({ accessToken, expiresIn });
  if (expiresAt) {
    window.localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
  } else {
    window.localStorage.removeItem(EXPIRES_AT_KEY);
  }

  dispatchAuthSessionChanged();
  return expiresAt;
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(EXPIRES_AT_KEY);
  dispatchAuthSessionChanged();
};

export const getStoredAuthSession = () => {
  if (typeof window === "undefined") {
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    };
  }

  let user = null;

  try {
    const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    user = null;
  }

  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
  const expiresAtRaw = window.localStorage.getItem(EXPIRES_AT_KEY);
  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : null;

  return {
    user,
    accessToken,
    refreshToken,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : null,
  };
};

export const isSessionExpired = (expiresAt) => {
  if (!expiresAt) return false;
  return Date.now() >= Number(expiresAt);
};

export const getTimeUntilExpiry = (expiresAt) => {
  if (!expiresAt) return null;
  return Math.max(0, Number(expiresAt) - Date.now());
};
