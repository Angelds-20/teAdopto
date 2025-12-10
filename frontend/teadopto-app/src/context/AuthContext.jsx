import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [refreshToken, setRefreshToken] = useState(() =>
    localStorage.getItem("refreshToken"),
  );
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [status, setStatus] = useState({
    loading: false,
    error: null,
  });

  const persistSession = useCallback((access, refresh, profile) => {
    localStorage.setItem("token", access);
    localStorage.setItem("refreshToken", refresh);
    localStorage.setItem("user", JSON.stringify(profile));
    setToken(access);
    setRefreshToken(refresh);
    setUser(profile);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async ({ username, password }) => {
    setStatus({ loading: true, error: null });
    try {
      // Intentar primero con el username tal cual, luego normalizado
      // Esto permite que usuarios existentes (creados antes) funcionen
      const trimmedUsername = username.trim();
      let loginData;

      try {
        // Intentar primero con el username tal cual
        loginData = await api.post("login/", {
          username: trimmedUsername,
          password: password
        });
      } catch (firstError) {
        // Si falla, intentar con minúsculas (para usuarios nuevos)
        if (firstError.response?.status === 401) {
          loginData = await api.post("login/", {
            username: trimmedUsername.toLowerCase(),
            password: password
          });
        } else {
          throw firstError;
        }
      }

      const { data } = loginData;
      // Obtener perfil completo del usuario
      const tempApi = api;
      tempApi.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
      const profileRes = await tempApi.get("users/me/");
      const profile = profileRes.data;
      persistSession(data.access, data.refresh, profile);
      setStatus({ loading: false, error: null });
      return true;
    } catch (error) {
      console.error("Error en login:", error);
      let detail = "Credenciales inválidas o servidor no disponible.";
      if (error.response) {
        if (error.response.data?.detail) {
          detail = error.response.data.detail;
        } else if (error.response.status === 401) {
          detail = "Usuario o contraseña incorrectos. Verifica tus credenciales.";
        } else if (error.response.status === 400) {
          detail = "Datos inválidos. Verifica el formato de usuario y contraseña.";
        }
      } else if (error.request) {
        detail = "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.";
      }
      setStatus({ loading: false, error: detail });
      clearSession();
      return false;
    }
  }, [persistSession, clearSession]);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const clearAuthError = useCallback(() => {
    setStatus((prev) => ({ ...prev, error: null }));
  }, []);

  // Listen for 401 events from api interceptor
  React.useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [logout]);

  const value = useMemo(
    () => ({
      token,
      refreshToken,
      user,
      isAuthenticated: Boolean(token),
      isAdmin: user?.role === "admin",
      isShelter: user?.role === "shelter",
      isClient: user?.role === "client",
      login,
      logout,
      authError: status.error,
      authLoading: status.loading,
      clearAuthError,
    }),
    [token, refreshToken, user, login, logout, status, clearAuthError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}

