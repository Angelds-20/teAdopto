import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getMediaUrl } from "../utils/media";

export default function EditShelter() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin, isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [shelterForm, setShelterForm] = useState({
        name: "",
        address: "",
        verified: false,
        user: "",
    });
    const [users, setUsers] = useState([]);
    const [shelterPhoto, setShelterPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [currentPhoto, setCurrentPhoto] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!isAdmin) {
                alert("No tienes permiso para editar refugios.");
                navigate("/shelters");
                return;
            }

            try {
                const [shelterRes, usersRes] = await Promise.all([
                    api.get(`shelters/${id}/`),
                    api.get("users/")
                ]);

                const shelter = shelterRes.data;
                setShelterForm({
                    name: shelter.name,
                    address: shelter.address || "",
                    verified: shelter.verified,
                    user: shelter.user || "",
                });
                setCurrentPhoto(shelter.photo);

                const usersData = usersRes.data.results || usersRes.data || [];
                setUsers(Array.isArray(usersData) ? usersData.filter((u) => u.role === "shelter") : []);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Error al cargar la información del refugio.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isAdmin, navigate]);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert("Por favor, selecciona un archivo de imagen válido.");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert("La imagen es demasiado grande (máximo 5MB).");
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

    const handleSubmit = async (e) => {
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

            await api.patch(`shelters/${id}/`, formData);
            alert("Refugio actualizado exitosamente");
            navigate("/shelters");
        } catch (err) {
            console.error("Error updating shelter:", err);
            alert("Error al actualizar el refugio. " + (err.response?.data?.detail || ""));
        }
    };

    if (loading) return <p className="loading">Cargando...</p>;
    if (error) return <p className="form__error">{error}</p>;

    return (
        <div className="page-container">
            <div className="card form-card" style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h3>Editar Refugio</h3>
                <form onSubmit={handleSubmit} className="form">
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
                            Formatos aceptados: JPG, PNG, GIF. Tamaño máximo: 5MB.
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
                        {currentPhoto && !photoPreview && (
                            <div style={{ marginTop: "1rem" }}>
                                <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem" }}>
                                    Foto actual:
                                </p>
                                <img
                                    src={getMediaUrl(currentPhoto)}
                                    alt="Foto actual"
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
                            Guardar cambios
                        </button>
                        <button
                            type="button"
                            className="btn btn--ghost"
                            onClick={() => navigate("/shelters")}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
