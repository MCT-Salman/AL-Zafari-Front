import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "@/api/authApi";

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

  useEffect(() => {
    // Check for stored auth on mount
    const stored = localStorage.getItem("auth");
    const token = localStorage.getItem("accessToken");
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("auth");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
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

        // Store tokens
        if (accessToken) localStorage.setItem("accessToken", accessToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("auth", JSON.stringify(userInfo));

        return response;
      }
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = async () => {
    // caller is responsible for any confirmation dialog
    try {
      await authApi.logout();
    } catch (error) {
      // ignore
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("auth");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
