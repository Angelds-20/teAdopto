import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import NavBar from "../components/NavBar";
import { getAdminUrl } from "../utils/media";

export default function Angel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isAdmin, user } = useAuth();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ users: 0, pets: 0, shelters: 0, adoptions: 0 });

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadStats();
    }
  }, [isAuthenticated, isAdmin]);

  const loadStats = async () => {
    try {
      const [usersRes, petsRes, sheltersRes, adoptionsRes] = await Promise.all([
        api.get("users/").catch(() => ({ data: [] })),
        api.get("pets/").catch(() => ({ data: [] })),
        api.get("shelters/").catch(() => ({ data: [] })),
        api.get("adoptions/").catch(() => ({ data: [] })),
      ]);
      setStats({
        users: Array.isArray(usersRes.data) ? usersRes.data.length : 0,
        pets: Array.isArray(petsRes.data) ? petsRes.data.length : 0,
        shelters: Array.isArray(sheltersRes.data) ? sheltersRes.data.length : 0,
        adoptions: Array.isArray(adoptionsRes.data) ? adoptionsRes.data.length : 0,
      });
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const success = await login(credentials);
      if (success) {
        const profileRes = await api.get("users/me/");
        if (profileRes.data.role !== "admin") {
          setError("Este acceso es solo para administradores.");
          return;
        }
        await loadStats();
      } else {
        setError("Credenciales incorrectas.");
      }
    } catch (err) {
      setError("Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <>
        <NavBar />
        <section className="card" style={{ maxWidth: "500px", margin: "2rem auto" }}>
          <h2>🔐 Acceso Administrativo</h2>
          <p>Ingresa tus credenciales de administrador</p>
          {error && <p className="form__error" style={{ marginTop: "1rem" }}>{error}</p>}
          <form onSubmit={handleLogin} className="form" style={{ marginTop: "1.5rem" }}>
            <label>
              Usuario
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                required
                placeholder="ejemplo_usuario"
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
                placeholder="Ingresa tu contraseña"
              />
            </label>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Acceder"}
            </button>
          </form>
        </section>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <section className="adoptions">
      <header>
        <p className="eyebrow">👑 Panel de Administración</p>
        <h2>Bienvenido, {user?.username}</h2>
        <p>Gestión completa del sistema TeAdopto</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "2rem" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: "2rem", margin: "0.5rem 0" }}>{stats.users}</h3>
          <p>Usuarios</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: "2rem", margin: "0.5rem 0" }}>{stats.pets}</h3>
          <p>Mascotas</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: "2rem", margin: "0.5rem 0" }}>{stats.shelters}</h3>
          <p>Refugios</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: "2rem", margin: "0.5rem 0" }}>{stats.adoptions}</h3>
          <p>Solicitudes</p>
        </div>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Accesos Rápidos</h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <button className="btn btn--primary" onClick={() => navigate("/pets")}>
            Ver Mascotas
          </button>
          <button className="btn btn--primary" onClick={() => navigate("/shelters")}>
            Ver Refugios
          </button>
          <button className="btn btn--primary" onClick={() => navigate("/adoptions")}>
            Ver Solicitudes
          </button>
          <button className="btn btn--primary" onClick={() => navigate("/users")}>
            Ver Usuarios
          </button>
          <a href={getAdminUrl()} target="_blank" rel="noopener noreferrer" className="btn btn--primary">
            Django Admin
          </a>
        </div>
      </div>
    </section>
    </>
  );
}

