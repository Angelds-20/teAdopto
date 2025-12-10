import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function EditPet() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAdmin, isShelter, isClient } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [petForm, setPetForm] = useState({
        name: "",
        pet_type: "dog",
        breed: "",
        age: "",
        age_unit: "years",
        size: "",
        description: "",
        status: "available",
    });
    const [petPhotos, setPetPhotos] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [existingPhotos, setExistingPhotos] = useState([]);

    useEffect(() => {
        const fetchPet = async () => {
            try {
                const response = await api.get(`pets/${id}/`);
                const pet = response.data;

                // Check permissions
                let canEdit = false;
                if (isAdmin) canEdit = true;
                else if (isShelter && pet.shelter) {
                    // Need to fetch shelter info to verify ownership if not available in user context
                    // But usually user.shelter logic is backend side. 
                    // Frontend check:
                    const sheltersRes = await api.get("shelters/");
                    const sheltersData = sheltersRes.data.results || sheltersRes.data || [];
                    const userShelter = Array.isArray(sheltersData) ? sheltersData.find((s) => s.user === user?.id) : null;
                    if (userShelter && userShelter.id === pet.shelter) canEdit = true;
                } else if (isClient && pet.owner === user?.id) {
                    canEdit = true;
                }

                if (!canEdit) {
                    alert("No tienes permiso para editar esta mascota.");
                    navigate("/pets");
                    return;
                }

                setPetForm({
                    name: pet.name,
                    pet_type: pet.pet_type,
                    breed: pet.breed || "",
                    age: pet.age || "",
                    age_unit: pet.age_unit || "years",
                    size: pet.size || "",
                    description: pet.description || "",
                    status: pet.status,
                });
                setExistingPhotos(pet.photos || []);
            } catch (err) {
                setError("Error al cargar la mascota.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPet();
    }, [id, isAdmin, isShelter, isClient, user, navigate]);

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const validFiles = [];
        const previews = [];

        files.forEach((file) => {
            if (!file.type.startsWith('image/')) {
                alert(`El archivo ${file.name} no es una imagen válida.`);
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert(`La imagen ${file.name} es demasiado grande (máximo 5MB).`);
                return;
            }
            validFiles.push(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                previews.push(reader.result);
                if (previews.length === validFiles.length) {
                    setPhotoPreviews([...photoPreviews, ...previews]);
                }
            };
            reader.readAsDataURL(file);
        });

        setPetPhotos([...petPhotos, ...validFiles]);
    };

    const removePhoto = (index) => {
        const newPhotos = [...petPhotos];
        const newPreviews = [...photoPreviews];
        newPhotos.splice(index, 1);
        newPreviews.splice(index, 1);
        setPetPhotos(newPhotos);
        setPhotoPreviews(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', petForm.name);
            formData.append('pet_type', petForm.pet_type);
            if (petForm.breed) formData.append('breed', petForm.breed);
            if (petForm.age) {
                formData.append('age', petForm.age);
                formData.append('age_unit', petForm.age_unit || 'years');
            }
            if (petForm.size) formData.append('size', petForm.size);
            if (petForm.description) formData.append('description', petForm.description);
            formData.append('status', petForm.status);

            petPhotos.forEach((photo) => {
                formData.append('photos', photo);
            });

            await api.patch(`pets/${id}/`, formData);
            alert("Mascota actualizada exitosamente");
            navigate("/pets");
        } catch (err) {
            console.error("Error al guardar:", err);
            alert("Error al actualizar la mascota.");
        }
    };

    if (loading) return <p className="loading">Cargando...</p>;
    if (error) return <p className="form__error">{error}</p>;

    return (
        <div className="page-container">
            <div className="card form-card" style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h3>Editar Mascota</h3>
                <form onSubmit={handleSubmit} className="form">
                    <label>
                        Nombre *
                        <input
                            type="text"
                            value={petForm.name}
                            onChange={(e) =>
                                setPetForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                            required
                        />
                    </label>
                    <label>
                        Tipo *
                        <select
                            value={petForm.pet_type}
                            onChange={(e) =>
                                setPetForm((prev) => ({ ...prev, pet_type: e.target.value }))
                            }
                            required
                        >
                            <option value="dog">Perro</option>
                            <option value="cat">Gato</option>
                        </select>
                    </label>
                    <label>
                        Raza
                        <input
                            type="text"
                            value={petForm.breed}
                            onChange={(e) =>
                                setPetForm((prev) => ({ ...prev, breed: e.target.value }))
                            }
                        />
                    </label>
                    <label>
                        Edad
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <input
                                type="number"
                                value={petForm.age}
                                onChange={(e) =>
                                    setPetForm((prev) => ({ ...prev, age: e.target.value }))
                                }
                                placeholder="0"
                                min="0"
                                style={{ flex: 1 }}
                            />
                            <select
                                value={petForm.age_unit}
                                onChange={(e) =>
                                    setPetForm((prev) => ({ ...prev, age_unit: e.target.value }))
                                }
                                style={{ minWidth: "120px" }}
                            >
                                <option value="months">Meses</option>
                                <option value="years">Años</option>
                            </select>
                        </div>
                    </label>
                    <label>
                        Tamaño
                        <input
                            type="text"
                            value={petForm.size}
                            onChange={(e) =>
                                setPetForm((prev) => ({ ...prev, size: e.target.value }))
                            }
                            placeholder="Ejemplo: Mediano"
                        />
                    </label>
                    <label>
                        Descripción
                        <textarea
                            value={petForm.description}
                            onChange={(e) =>
                                setPetForm((prev) => ({ ...prev, description: e.target.value }))
                            }
                            rows="3"
                        />
                    </label>
                    <label>
                        Estado
                        <select
                            value={petForm.status}
                            onChange={(e) =>
                                setPetForm((prev) => ({ ...prev, status: e.target.value }))
                            }
                        >
                            <option value="available">Disponible</option>
                            <option value="adopted">Adoptado</option>
                            <option value="pending">Pendiente</option>
                        </select>
                    </label>
                    <label>
                        Nuevas fotos (se añadirán a las existentes)
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            multiple
                            style={{ marginTop: "0.5rem" }}
                        />
                        {photoPreviews.length > 0 && (
                            <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                {photoPreviews.map((preview, index) => (
                                    <div key={index} style={{ position: "relative" }}>
                                        <img
                                            src={preview}
                                            alt={`Vista previa ${index + 1}`}
                                            style={{
                                                width: "120px",
                                                height: "120px",
                                                borderRadius: "0.5rem",
                                                objectFit: "cover",
                                                border: "2px solid #e2e8f0"
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(index)}
                                            style={{
                                                position: "absolute",
                                                top: "-8px",
                                                right: "-8px",
                                                background: "#ef4444",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "50%",
                                                width: "24px",
                                                height: "24px",
                                                cursor: "pointer",
                                                fontSize: "16px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {existingPhotos.length > 0 && (
                            <div style={{ marginTop: "1rem" }}>
                                <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem" }}>
                                    Fotos actuales:
                                </p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                    {existingPhotos.map((photo, index) => (
                                        <img
                                            key={index}
                                            src={photo.photo_url || photo.photo}
                                            alt={`Foto actual ${index + 1}`}
                                            style={{
                                                width: "120px",
                                                height: "120px",
                                                borderRadius: "0.5rem",
                                                objectFit: "cover",
                                                border: "2px solid #e2e8f0"
                                            }}
                                        />
                                    ))}
                                </div>
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
                            onClick={() => navigate("/pets")}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
