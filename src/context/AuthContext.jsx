import { createContext, useContext, useEffect, useRef, useState } from "react";
import { authApi } from "@/api/authApi";
import { toast } from "react-hot-toast";
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearAuthSession,
  getStoredAuthSession,
  getTimeUntilExpiry,
  isSessionExpired,
  setLoggingOutFlag,
  storeAuthSession,
} from "@/utils/authSession";

// AuthContext | سياق المصادقة
export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const logoutTimerRef = useRef(null);

  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const finishClientLogout = () => {
    clearLogoutTimer();
    clearAuthSession();
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleSessionExpired = () => {
    setLoggingOutFlag(true);
    toast.dismiss();
    finishClientLogout();
  };

  const scheduleSessionExpiry = (expiresAt) => {
    clearLogoutTimer();

    const remaining = getTimeUntilExpiry(expiresAt);
    if (remaining === null) return;

    if (remaining <= 0) {
      handleSessionExpired();
      return;
    }

    logoutTimerRef.current = window.setTimeout(() => {
      handleSessionExpired();
    }, remaining);
  };

  const syncSessionFromStorage = () => {
    const { user: storedUser, accessToken, expiresAt } = getStoredAuthSession();

    if (!storedUser || !accessToken) {
      clearLogoutTimer();
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    if (isSessionExpired(expiresAt)) {
      handleSessionExpired();
      return;
    }

    setUser(storedUser);
    setIsAuthenticated(true);
    scheduleSessionExpiry(expiresAt);
  };

  useEffect(() => {
    setLoggingOutFlag(false);
    syncSessionFromStorage();
    setLoading(false);

    const handleSessionChanged = () => {
      syncSessionFromStorage();
    };

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChanged);

    return () => {
      clearLogoutTimer();
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChanged);
    };
  }, []);

  const login = async (username, password) => {
    try {
      setLoggingOutFlag(false);
      const response = await authApi.login({ username, password });

      // Support both payload shapes:
      // - direct data object (current authApi)
      // - axios response object with .data
      const payload = response?.data ?? response;
      const userData = payload?.data ?? payload;

      if (userData) {
        const { accessToken, refreshToken, expiresIn: _expiresIn, userWithoutPassword } = userData;
        const userInfo = userWithoutPassword || userData;

        setUser(userInfo);
        setIsAuthenticated(true);

        const expiresAt = storeAuthSession({
          user: userInfo,
          accessToken,
          refreshToken,
          expiresIn: _expiresIn,
        });

        scheduleSessionExpiry(expiresAt);

        return response;
      }
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = async () => {
    // caller is responsible for any confirmation dialog
    setLoggingOutFlag(true);
    toast.dismiss();
    clearLogoutTimer();
    try {
      await authApi.logout();
    } catch (error) {
      // ignore
    } finally {
      finishClientLogout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
