import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function EditUser() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userForm, setUserForm] = useState({
        username: "",
        email: "",
        role: "client",
        phone: "",
    });

    useEffect(() => {
        const fetchUser = async () => {
            if (!isAdmin) {
                alert("No tienes permiso para editar usuarios.");
                navigate("/users");
                return;
            }

            try {
                const { data } = await api.get(`users/${id}/`);
                setUserForm({
                    username: data.username,
                    email: data.email || "",
                    role: data.role,
                    phone: data.phone || "",
                });
            } catch (err) {
                console.error("Error fetching user:", err);
                setError("Error al cargar la información del usuario.");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id, isAdmin, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`users/${id}/`, {
                email: userForm.email,
                role: userForm.role,
                phone: userForm.phone
            });
            alert("Usuario actualizado exitosamente");
            navigate("/users");
        } catch (err) {
            console.error("Error updating user:", err);
            alert("Error al actualizar el usuario. " + (err.response?.data?.detail || ""));
        }
    };

    if (loading) return <p className="loading">Cargando...</p>;
    if (error) return <p className="form__error">{error}</p>;

    return (
        <div className="page-container">
            <div className="card form-card" style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h3>Editar Usuario</h3>
                <form onSubmit={handleSubmit} className="form">
                    <label>
                        Usuario
                        <input
                            type="text"
                            value={userForm.username}
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
                            onClick={() => navigate("/users")}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
