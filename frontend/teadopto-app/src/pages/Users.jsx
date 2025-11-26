import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Users() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    role: "client",
    phone: "",
  });

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get("users/");
        setUsers(data);
      } catch (err) {
        const detail =
          err.response?.status === 401
            ? "Tu sesión expiró o no tienes permisos. Inicia sesión nuevamente."
            : "No se pudieron cargar los usuarios. Intenta más tarde.";
        setError(detail);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [isAuthenticated, isAdmin]);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.patch(`users/${editingUser.id}/`, userForm);
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, ...userForm } : u))
        );
      }
      setShowUserForm(false);
      setEditingUser(null);
      setUserForm({
        username: "",
        email: "",
        role: "client",
        phone: "",
      });
    } catch (err) {
      alert("Error al guardar el usuario. " + (err.response?.data?.detail || ""));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;
    try {
      await api.delete(`users/${userId}/`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert("Error al eliminar el usuario.");
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="card">
        <h2>Acceso restringido</h2>
        <p>Debes iniciar sesión para ver esta página.</p>
        <Link to="/login" className="btn btn--primary">
          Ir a iniciar sesión
        </Link>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="card">
        <h2>Acceso denegado</h2>
        <p>Esta página solo está disponible para administradores.</p>
        <Link to="/" className="btn btn--primary">
          Volver al inicio
        </Link>
      </section>
    );
  }

  const getRoleLabel = (role) => {
    const labels = {
      admin: "Administrador",
      shelter: "Refugio",
      client: "Cliente",
    };
    return labels[role] || role;
  };

  return (
    <section className="users">
      <header>
        <p className="eyebrow">👥 Panel de administración</p>
        <h2>Gestión de usuarios</h2>
        <p>
          Gestiona los usuarios registrados en la plataforma: adoptadores, refugios y administradores.
        </p>
      </header>

      {showUserForm && editingUser && (
        <div className="card form-card" style={{ marginTop: "2rem" }}>
          <h3>Editar usuario</h3>
          <form onSubmit={handleUserSubmit} className="form">
            <label>
              Usuario
              <input
                type="text"
                value={userForm.username}
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, username: e.target.value }))
                }
                required
                disabled
                style={{ background: "#f1f5f9", cursor: "not-allowed" }}
              />
              <small className="form__hint">El nombre de usuario no se puede cambiar</small>
            </label>
            <label>
              Email *
              <input
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </label>
            <label>
              Rol *
              <select
                value={userForm.role}
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, role: e.target.value }))
                }
                required
              >
                <option value="client">Cliente</option>
                <option value="shelter">Refugio</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
            <label>
              Teléfono
              <input
                type="tel"
                value={userForm.phone}
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+56912345678"
              />
            </label>
            <div className="hero-card__actions">
              <button type="submit" className="btn btn--primary">
                Guardar cambios
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setShowUserForm(false);
                  setEditingUser(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="loading">Cargando usuarios...</p>}
      {error && <p className="form__error">{error}</p>}

      {!loading && !error && users.length === 0 && (
        <p>No hay usuarios registrados todavía.</p>
      )}

      <div className="user-grid">
        {users.map((user) => (
          <article key={user.id} className="card user-card">
            <h3>{user.username}</h3>
            <p>
              <strong>Email:</strong> {user.email || "Sin email"}
            </p>
            <p>
              <strong>Rol:</strong> {getRoleLabel(user.role)}
            </p>
            {user.phone && (
              <p>
                <strong>Teléfono:</strong> {user.phone}
              </p>
            )}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              <button
                className="btn btn--ghost"
                style={{ fontSize: "0.9rem" }}
                onClick={() => {
                  setEditingUser(user);
                  setUserForm({
                    username: user.username,
                    email: user.email || "",
                    role: user.role,
                    phone: user.phone || "",
                  });
                  setShowUserForm(true);
                }}
              >
                Editar
              </button>
              <button
                className="btn btn--danger"
                style={{ fontSize: "0.9rem" }}
                onClick={() => handleDeleteUser(user.id)}
              >
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
