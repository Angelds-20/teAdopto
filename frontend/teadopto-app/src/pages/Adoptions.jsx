import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Adoptions() {
  const { isAuthenticated, isClient, isAdmin, isShelter } = useAuth();
  const [requests, setRequests] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [editMessage, setEditMessage] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [requestsRes, petsRes] = await Promise.all([
          api.get("adoptions/"),
          api.get("pets/"),
        ]);
        const requestsData = requestsRes.data.results || requestsRes.data || [];
        setRequests(Array.isArray(requestsData) ? requestsData : []);
        setPets(petsRes.data.results || []);
      } catch (err) {
        const detail =
          err.response?.status === 401
            ? "Tu sesión expiró o no tienes permisos. Inicia sesión nuevamente."
            : "No se pudieron cargar las solicitudes. Intenta más tarde.";
        setError(detail);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  const getPetName = (petId) => {
    const pet = pets.find((p) => p.id === petId);
    return pet ? pet.name : `Mascota #${petId}`;
  };

  const handleUpdateRequest = async (requestId) => {
    try {
      await api.patch(`adoptions/${requestId}/`, {
        message: editMessage,
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, message: editMessage } : r
        )
      );
      setEditingRequest(null);
      setEditMessage("");
      alert("Solicitud actualizada exitosamente.");
    } catch (err) {
      alert("Error al actualizar la solicitud.");
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm("¿Eliminar esta solicitud?")) return;
    try {
      await api.delete(`adoptions/${requestId}/`);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      alert("Error al eliminar la solicitud.");
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

  if (!isClient && !isAdmin) {
    return (
      <section className="card">
        <h2>Acceso denegado</h2>
        <p>Esta página solo está disponible para clientes y administradores.</p>
        <Link to="/" className="btn btn--primary">
          Volver al inicio
        </Link>
      </section>
    );
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pendiente",
      approved: "Aprobada",
      rejected: "Rechazada",
      completed: "Completada",
    };
    return labels[status] || status;
  };

  return (
    <section className="adoptions">
      <header>
        <p className="eyebrow">💌 Solicitudes de adopción</p>
        <h2>
          {isClient ? "Mis solicitudes de adopción" : "Todas las solicitudes"}
        </h2>
        <p>
          {isClient
            ? "Revisa el estado de tus solicitudes y mantente al día con el proceso de adopción."
            : "Administra y supervisa todas las solicitudes de adopción del sistema."}
        </p>
      </header>

      {loading && <p className="loading">Cargando solicitudes...</p>}
      {error && <p className="form__error">{error}</p>}

      {!loading && !error && requests.length === 0 && (
        <p>No hay solicitudes registradas todavía.</p>
      )}

      <div className="user-grid">
        {requests.map((request) => (
          <article key={request.id} className="card user-card">
            <h3>{getPetName(request.pet)}</h3>
            <p>
              <strong>Estado:</strong> {getStatusLabel(request.status)}
            </p>
            <p>
              <strong>Mensaje:</strong> {request.message || "Sin mensaje"}
            </p>
            <p>
              <strong>Fecha:</strong>{" "}
              {new Date(request.created_at).toLocaleDateString()}
            </p>
            {isClient && request.status === "pending" && (
              <div style={{ marginTop: "1rem" }}>
                {editingRequest === request.id ? (
                  <div>
                    <textarea
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      rows="3"
                      style={{ width: "100%", marginBottom: "0.5rem" }}
                    />
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="btn btn--primary"
                        style={{ fontSize: "0.9rem" }}
                        onClick={() => handleUpdateRequest(request.id)}
                      >
                        Guardar
                      </button>
                      <button
                        className="btn btn--ghost"
                        style={{ fontSize: "0.9rem" }}
                        onClick={() => {
                          setEditingRequest(null);
                          setEditMessage("");
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                      className="btn btn--ghost"
                      style={{ fontSize: "0.9rem" }}
                      onClick={() => {
                        setEditingRequest(request.id);
                        setEditMessage(request.message || "");
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn--danger"
                      style={{ fontSize: "0.9rem" }}
                      onClick={() => handleDeleteRequest(request.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}
            {(isAdmin || isShelter) && (
              <div style={{ marginTop: "1rem" }}>
                <select
                  value={request.status}
                  onChange={async (e) => {
                    try {
                      await api.patch(`adoptions/${request.id}/`, {
                        status: e.target.value,
                      });
                      setRequests((prev) =>
                        prev.map((r) =>
                          r.id === request.id
                            ? { ...r, status: e.target.value }
                            : r
                        )
                      );
                    } catch (err) {
                      alert("Error al actualizar el estado.");
                    }
                  }}
                  style={{ marginBottom: "0.5rem" }}
                >
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobada</option>
                  <option value="rejected">Rechazada</option>
                  <option value="completed">Completada</option>
                </select>
                {isAdmin && (
                  <button
                    className="btn btn--danger"
                    style={{ fontSize: "0.9rem", width: "100%" }}
                    onClick={() => handleDeleteRequest(request.id)}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

