import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Users() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`users/?page=${currentPage}`);
        const usersData = data.results || data || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
        setPagination({
          count: data.count || (Array.isArray(data) ? data.length : 0),
          next: data.next || null,
          previous: data.previous || null
        });
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
  }, [isAuthenticated, isAdmin, currentPage]);



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
              <Link
                to={`/users/edit/${user.id}`}
                className="btn btn--ghost"
                style={{ fontSize: "0.9rem", textDecoration: "none" }}
              >
                Editar
              </Link>
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

      {/* Pagination Controls */}
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2rem" }}>
        <button
          className="btn btn--ghost"
          disabled={!pagination.previous}
          onClick={() => setCurrentPage(prev => prev - 1)}
          style={{ opacity: !pagination.previous ? 0.5 : 1 }}
        >
          Anterior
        </button>
        <span style={{ display: "flex", alignItems: "center" }}>
          Página {currentPage}
        </span>
        <button
          className="btn btn--ghost"
          disabled={!pagination.next}
          onClick={() => setCurrentPage(prev => prev + 1)}
          style={{ opacity: !pagination.next ? 0.5 : 1 }}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}
