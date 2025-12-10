import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getMediaUrl } from "../utils/media";

export default function Shelters() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [shelters, setShelters] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showShelterForm, setShowShelterForm] = useState(false);
  const [editingShelter, setEditingShelter] = useState(null);
  const [shelterForm, setShelterForm] = useState({
    name: "",
    address: "",
    verified: false,
    user: "",
  });
  const [shelterPhoto, setShelterPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [sheltersRes, usersRes] = await Promise.all([
          api.get(`shelters/?page=${currentPage}`),
          isAdmin && isAuthenticated ? api.get("users/") : Promise.resolve({ data: [] }),
        ]);

        const sheltersData = sheltersRes.data.results || sheltersRes.data || [];
        setShelters(Array.isArray(sheltersData) ? sheltersData : []);
        setPagination({
          count: sheltersRes.data.count || (Array.isArray(sheltersRes.data) ? sheltersRes.data.length : 0),
          next: sheltersRes.data.next || null,
          previous: sheltersRes.data.previous || null
        });

        if (isAdmin && isAuthenticated) {
          const usersData = usersRes.data.results || usersRes.data || [];
          setUsers(Array.isArray(usersData) ? usersData.filter((u) => u.role === "shelter") : []);
        }
      } catch (err) {
        const detail =
          err.response?.status === 401
            ? "Tu sesión expiró o no tienes permisos. Inicia sesión nuevamente."
            : "No se pudieron cargar los refugios. Intenta más tarde.";
        setError(detail);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, isAdmin, currentPage]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Por favor, selecciona un archivo de imagen válido (JPG, PNG, etc.)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen es demasiado grande. Por favor, selecciona una imagen menor a 5MB.");
        return;
      }
      setShelterPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShelterSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', shelterForm.name);
      if (shelterForm.address) formData.append('address', shelterForm.address);
      formData.append('verified', shelterForm.verified);
      if (shelterForm.user) formData.append('user', shelterForm.user);

      if (shelterPhoto) {
        formData.append('photo', shelterPhoto);
      }

      if (editingShelter) {
        const { data } = await api.patch(`shelters/${editingShelter.id}/`, formData);
        setShelters((prev) =>
          prev.map((s) =>
            s.id === editingShelter.id ? { ...s, ...data } : s
          )
        );
      } else {
        const { data } = await api.post("shelters/", formData);
        setShelters((prev) => [...prev, data]);
      }
      setShowShelterForm(false);
      setEditingShelter(null);
      setShelterPhoto(null);
      setPhotoPreview(null);
      setShelterForm({
        name: "",
        address: "",
        verified: false,
        user: "",
      });
      // Recargar datos
      const sheltersRes = await api.get(`shelters/?page=${currentPage}`);
      const sheltersData = sheltersRes.data.results || sheltersRes.data || [];
      setShelters(Array.isArray(sheltersData) ? sheltersData : []);
      setPagination({
        count: sheltersRes.data.count || (Array.isArray(sheltersRes.data) ? sheltersRes.data.length : 0),
        next: sheltersRes.data.next || null,
        previous: sheltersRes.data.previous || null
      });
    } catch (err) {
      alert("Error al guardar el refugio. " + (err.response?.data?.detail || ""));
    }
  };

  const handleDeleteShelter = async (shelterId) => {
    if (!window.confirm("¿Eliminar este refugio?")) return;
    try {
      await api.delete(`shelters/${shelterId}/`);
      setShelters((prev) => prev.filter((s) => s.id !== shelterId));
    } catch (err) {
      alert("Error al eliminar el refugio.");
    }
  };


  return (
    <section className="shelters">
      <header>
        <p className="eyebrow">🏠 Refugios asociados</p>
        <h2>Conoce nuestros refugios</h2>
        <p>Descubre los refugios verificados que trabajan con nosotros para encontrar hogares para las mascotas.</p>
        {isAdmin && (
          <button
            className="btn btn--primary"
            onClick={() => {
              setEditingShelter(null);
              setShelterPhoto(null);
              setPhotoPreview(null);
              setShelterForm({
                name: "",
                address: "",
                verified: false,
                user: "",
              });
              setShowShelterForm(true);
            }}
          >
            ➕ Nuevo refugio
          </button>
        )}
      </header>

      {showShelterForm && isAdmin && (
        <div className="card form-card" style={{ marginTop: "2rem" }}>
          <h3>{editingShelter ? "Editar refugio" : "Nuevo refugio"}</h3>
          <form onSubmit={handleShelterSubmit} className="form">
            <label>
              Nombre *
              <input
                type="text"
                value={shelterForm.name}
                onChange={(e) =>
                  setShelterForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </label>
            <label>
              Dirección
              <textarea
                value={shelterForm.address}
                onChange={(e) =>
                  setShelterForm((prev) => ({ ...prev, address: e.target.value }))
                }
                rows="3"
              />
            </label>
            <label>
              Usuario (debe tener rol "shelter") *
              <select
                value={shelterForm.user}
                onChange={(e) =>
                  setShelterForm((prev) => ({ ...prev, user: e.target.value }))
                }
                required
              >
                <option value="">Selecciona un usuario</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={shelterForm.verified}
                onChange={(e) =>
                  setShelterForm((prev) => ({ ...prev, verified: e.target.checked }))
                }
              />
              Verificado
            </label>
            <label>
              Foto del refugio
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ marginTop: "0.5rem" }}
              />
              <small style={{ display: "block", marginTop: "0.25rem", color: "#64748b" }}>
                Formatos aceptados: JPG, PNG, GIF. Tamaño máximo: 5MB. Se convertirá automáticamente a JPG y se optimizará.
              </small>
              {photoPreview && (
                <div style={{ marginTop: "1rem" }}>
                  <img
                    src={photoPreview}
                    alt="Vista previa"
                    style={{
                      maxWidth: "200px",
                      maxHeight: "200px",
                      borderRadius: "0.5rem",
                      objectFit: "cover"
                    }}
                  />
                </div>
              )}
              {editingShelter && editingShelter.photo && !photoPreview && (
                <div style={{ marginTop: "1rem" }}>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem" }}>
                    Foto actual:
                  </p>
                  <img
                    src={getMediaUrl(editingShelter.photo)}
                    alt={editingShelter.name}
                    style={{
                      maxWidth: "200px",
                      maxHeight: "200px",
                      borderRadius: "0.5rem",
                      objectFit: "cover"
                    }}
                  />
                </div>
              )}
            </label>
            <div className="hero-card__actions">
              <button type="submit" className="btn btn--primary">
                {editingShelter ? "Guardar cambios" : "Crear refugio"}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setShowShelterForm(false);
                  setEditingShelter(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="loading">Cargando refugios...</p>}
      {error && <p className="form__error">{error}</p>}

      {!loading && !error && shelters.length === 0 && (
        <p>No hay refugios registrados todavía.</p>
      )}

      <div className="shelter-grid">
        {shelters.map((shelter) => (
          <article key={shelter.id} className="card shelter-card">
            {shelter.photo && (
              <img
                src={getMediaUrl(shelter.photo)}
                alt={shelter.name}
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "0.5rem 0.5rem 0 0",
                  marginBottom: "1rem"
                }}
              />
            )}
            <h3>{shelter.name}</h3>
            <p>{shelter.address || "Sin dirección registrada"}</p>
            <p>
              Estado:{" "}
              <strong>{shelter.verified ? "Verificado" : "Pendiente"}</strong>
            </p>
            {isAdmin && (
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                <Link
                  to={`/shelters/edit/${shelter.id}`}
                  className="btn btn--ghost"
                  style={{ fontSize: "0.9rem", textDecoration: "none" }}
                >
                  Editar
                </Link>
                <button
                  className="btn btn--danger"
                  style={{ fontSize: "0.9rem" }}
                  onClick={() => handleDeleteShelter(shelter.id)}
                >
                  Eliminar
                </button>
              </div>
            )}
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
