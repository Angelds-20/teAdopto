import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, logout, isAuthenticated, user, isAdmin, isShelter, isClient, authLoading, authError, clearAuthError } =
    useAuth();
  const [loginType, setLoginType] = useState("client"); // "client" o "shelter"
  const [form, setForm] = useState({ username: "", password: "" });
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    return () => clearAuthError();
  }, [clearAuthError]);

  // Redirigir según el rol después del login y validar tipo de login
  useEffect(() => {
    if (isAuthenticated && user) {
      // Validar que el tipo de login coincida con el rol del usuario
      const userRole = user.role;
      if (loginType === "shelter" && userRole !== "shelter" && userRole !== "admin") {
        logout();
        setLocalError("Este usuario no es un refugio. Por favor, selecciona 'Usuario' para iniciar sesión.");
        return;
      }
      if (loginType === "client" && userRole === "shelter") {
        logout();
        setLocalError("Este usuario es un refugio. Por favor, selecciona 'Refugio' para iniciar sesión.");
        return;
      }
      
      // Si la validación pasa, redirigir según el rol
      setTimeout(() => {
        if (isAdmin) {
          navigate("/angel");
        } else if (isShelter) {
          navigate("/pets");
        } else if (isClient) {
          navigate("/pets");
        } else {
          navigate("/");
        }
      }, 100);
    }
  }, [isAuthenticated, user, isAdmin, isShelter, isClient, loginType, navigate, logout]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError(null);
    if (!form.username || !form.password) {
      setLocalError("Ingresa usuario y contraseña.");
      return;
    }
    
    const success = await login(form);
    // La validación del rol se hará en el useEffect después de que el contexto se actualice
  };

  if (isAuthenticated) {
    const getRoleDescription = () => {
      if (isAdmin) return "administrador";
      if (isShelter) return "refugio";
      if (isClient) return "adoptador";
      return "usuario";
    };

    const getRoleActions = () => {
      if (isAdmin) {
        return (
          <>
            <button type="button" className="btn btn--primary" onClick={() => navigate("/angel")}>
              Panel de Administración
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => navigate("/pets")}>
              Ver Mascotas
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => navigate("/users")}>
              Ver Usuarios
            </button>
          </>
        );
      } else if (isShelter) {
        return (
          <>
            <button type="button" className="btn btn--primary" onClick={() => navigate("/pets")}>
              Gestionar Mascotas
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => navigate("/shelters")}>
              Ver Refugios
            </button>
          </>
        );
      } else if (isClient) {
        return (
          <>
            <button type="button" className="btn btn--primary" onClick={() => navigate("/pets")}>
              Ver Mascotas
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => navigate("/adoptions")}>
              Mis Solicitudes
            </button>
          </>
        );
      }
      return (
        <button type="button" className="btn btn--ghost" onClick={() => navigate("/pets")}>
          Ver Mascotas
        </button>
      );
    };

    return (
      <section className="card form-card">
        <h2>Ya tienes sesión iniciada</h2>
        <p>
          Has iniciado sesión como <strong>{getRoleDescription()}</strong>.
          {user?.username && ` (${user.username})`}
        </p>
        <div className="hero-card__actions" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
          {getRoleActions()}
          <button type="button" className="btn btn--danger" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="card form-card" style={{ maxWidth: "500px", margin: "2rem auto" }}>
      <h2>🔐 Inicia sesión</h2>
      <p>Selecciona el tipo de cuenta e ingresa tus credenciales.</p>
      
      {/* Selector de tipo de login */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#1e293b" }}>
          Tipo de cuenta *
        </label>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "0.75rem"
        }}>
          <button
            type="button"
            onClick={() => setLoginType("client")}
            style={{
              padding: "1rem",
              borderRadius: "0.5rem",
              border: "2px solid",
              borderColor: loginType === "client" ? "#2563eb" : "#e2e8f0",
              background: loginType === "client" ? "#eff6ff" : "white",
              color: loginType === "client" ? "#2563eb" : "#64748b",
              cursor: "pointer",
              transition: "all 0.2s",
              fontWeight: loginType === "client" ? "600" : "400",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>👤</span>
            <span>Usuario</span>
            <small style={{ fontSize: "0.75rem", opacity: 0.8 }}>Adoptador</small>
          </button>
          <button
            type="button"
            onClick={() => setLoginType("shelter")}
            style={{
              padding: "1rem",
              borderRadius: "0.5rem",
              border: "2px solid",
              borderColor: loginType === "shelter" ? "#2563eb" : "#e2e8f0",
              background: loginType === "shelter" ? "#eff6ff" : "white",
              color: loginType === "shelter" ? "#2563eb" : "#64748b",
              cursor: "pointer",
              transition: "all 0.2s",
              fontWeight: loginType === "shelter" ? "600" : "400",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>🏠</span>
            <span>Refugio</span>
            <small style={{ fontSize: "0.75rem", opacity: 0.8 }}>Organización</small>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Usuario
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="ejemplo_usuario"
            required
          />
        </label>
        <label>
          Contraseña
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Ingresa tu contraseña"
            required
          />
        </label>
        {(localError || authError) && (
          <p className="form__error">{localError || authError}</p>
        )}
        <button type="submit" className="btn btn--primary" disabled={authLoading}>
          {authLoading ? "Validando..." : "Iniciar sesión"}
        </button>
      </form>
      <p className="form__hint" style={{ marginTop: "1.5rem", textAlign: "center" }}>
        ¿No tienes cuenta?{" "}
        <Link to="/register" style={{ color: "#2563eb", textDecoration: "underline" }}>
          Regístrate aquí
        </Link>
      </p>
    </section>
  );
}
