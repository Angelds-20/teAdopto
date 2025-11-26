import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getMediaUrl } from "../utils/media";

export default function Pets() {
  const { isAuthenticated, isAdmin, isShelter, isClient, user } = useAuth();
  const [pets, setPets] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPetForm, setShowPetForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
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
  const [showAdoptionForm, setShowAdoptionForm] = useState(null);
  const [adoptionMessage, setAdoptionMessage] = useState("");
  const [adoptionRequests, setAdoptionRequests] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const promises = [
          api.get("pets/"),
          api.get("shelters/").catch(() => ({ data: [] })),
        ];
        
        if (isAuthenticated) {
          promises.push(
            api.get("adoptions/").catch(() => ({ data: [] }))
          );
        }
        
        const results = await Promise.all(promises);
        setPets(results[0].data);
        setShelters(results[1].data || []);
        if (isAuthenticated && results[2]) {
          setAdoptionRequests(results[2].data || []);
        }
      } catch (err) {
        const detail =
          err.response?.status === 401
            ? "Tu sesión expiró o no tienes permisos. Inicia sesión nuevamente."
            : "No se pudieron cargar las mascotas. Intenta más tarde.";
        setError(detail);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = [];
    const previews = [];

    files.forEach((file) => {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        alert(`El archivo ${file.name} no es una imagen válida. Se omitirá.`);
        return;
      }
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`La imagen ${file.name} es demasiado grande (máximo 5MB). Se omitirá.`);
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

  const handlePetSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que se haya subido al menos una foto (solo para nuevas mascotas)
    if (!editingPet && petPhotos.length === 0) {
      alert("Por favor, sube al menos una foto de la mascota. Es requerida.");
      return;
    }

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

      if (editingPet) {
        await api.patch(`pets/${editingPet.id}/`, formData);
        const petsRes = await api.get("pets/");
        setPets(petsRes.data);
      } else {
        await api.post("pets/", formData);
        const petsRes = await api.get("pets/");
        setPets(petsRes.data);
      }
      setShowPetForm(false);
      setEditingPet(null);
      setPetPhotos([]);
      setPhotoPreviews([]);
      setPetForm({
        name: "",
        pet_type: "dog",
        breed: "",
        age: "",
        age_unit: "years",
        size: "",
        description: "",
        status: "available",
      });
    } catch (err) {
      console.error("Error al guardar la mascota:", err);
      const errorMsg = err.response?.data?.photo 
        ? `Error en la foto: ${err.response.data.photo[0]}`
        : err.response?.data?.detail || "Error al guardar la mascota. Verifica los datos.";
      alert(errorMsg);
    }
  };

  const handleDeletePet = async (petId) => {
    if (!window.confirm("¿Eliminar esta mascota?")) return;
    try {
      await api.delete(`pets/${petId}/`);
      setPets((prev) => prev.filter((p) => p.id !== petId));
    } catch (err) {
      alert("Error al eliminar la mascota.");
    }
  };

  const handleCreateAdoption = async (petId) => {
    try {
      const response = await api.post("adoptions/", {
        pet: petId,
        message: adoptionMessage || "",
      });
      setAdoptionRequests((prev) => [...prev, response.data]);
      alert("¡Solicitud de adopción enviada exitosamente! El refugio revisará tu solicitud.");
      setShowAdoptionForm(null);
      setAdoptionMessage("");
      if (isAuthenticated) {
        try {
          const requestsRes = await api.get("adoptions/");
          setAdoptionRequests(requestsRes.data || []);
        } catch (e) {
          console.error("Error al recargar solicitudes:", e);
        }
      }
    } catch (err) {
      console.error("Error completo al crear solicitud:", err);
      let errorMsg = "Error al crear la solicitud.";
      if (err.response?.data) {
        console.error("Datos de error:", err.response.data);
        if (err.response.data.detail) {
          errorMsg = Array.isArray(err.response.data.detail) 
            ? err.response.data.detail[0] 
            : err.response.data.detail;
        } else if (err.response.data.non_field_errors) {
          errorMsg = Array.isArray(err.response.data.non_field_errors)
            ? err.response.data.non_field_errors[0]
            : err.response.data.non_field_errors;
        } else if (err.response.data.pet) {
          errorMsg = Array.isArray(err.response.data.pet)
            ? err.response.data.pet[0]
            : err.response.data.pet;
        } else if (err.response.data.message) {
          errorMsg = Array.isArray(err.response.data.message)
            ? err.response.data.message[0]
            : err.response.data.message;
        } else {
          // Mostrar el primer error que encontremos
          const firstError = Object.values(err.response.data)[0];
          if (firstError) {
            errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
          }
        }
      } else if (err.request) {
        errorMsg = "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.";
      }
      alert(errorMsg);
    }
  };

  const canEditPet = (pet) => {
    if (isAdmin) return true;
    if (isShelter) {
      const userShelter = shelters.find((s) => s.user === user?.id);
      return userShelter && userShelter.id === pet.shelter;
    }
    if (isClient) {
      return pet.owner === user?.id;
    }
    return false;
  };

  const getAdoptionRequest = (petId) => {
    return adoptionRequests.find((req) => req.pet === petId);
  };

  const canRequestAdoption = (pet) => {
    if (!isAuthenticated || !isClient) return false;
    if (pet.status !== "available") return false;
    if (pet.owner === user?.id) return false;
    if (pet.shelter) {
      const userShelter = shelters.find((s) => s.user === user?.id);
      if (userShelter && userShelter.id === pet.shelter) return false;
    }
    const existingRequest = getAdoptionRequest(pet.id);
    if (existingRequest) return false;
    return true;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pendiente",
      approved: "Aprobada",
      rejected: "Rechazada",
      completed: "Completada",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#f59e0b",
      approved: "#10b981",
      rejected: "#ef4444",
      completed: "#3b82f6",
    };
    return colors[status] || "#6b7280";
  };

  return (
    <section className="pets">
      <header>
        <p className="eyebrow">🐾 Mascotas en adopción</p>
        <h2>Encuentra a tu compañero perfecto</h2>
        <p>Explora las mascotas disponibles que están buscando un hogar lleno de amor.</p>
        {(isShelter || isClient) && (
                 <button
                   className="btn btn--primary"
                   style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                   onClick={() => {
              setEditingPet(null);
              setPetPhotos([]);
              setPhotoPreviews([]);
              setPetForm({
                name: "",
                pet_type: "dog",
                breed: "",
                age: "",
                age_unit: "years",
                size: "",
                description: "",
                status: "available",
              });
              setShowPetForm(true);
            }}
          >
                   ➕ Nueva mascota
          </button>
        )}
        {!isAuthenticated && (
          <p style={{ marginTop: "1rem", color: "#64748b" }}>
            <Link to="/login" style={{ color: "#2563eb", textDecoration: "underline" }}>
              Inicia sesión
            </Link>{" "}
            para crear publicaciones de adopción o solicitar adoptar una mascota.
          </p>
        )}
      </header>

      {showPetForm && (
        <div className="card form-card" style={{ marginTop: "2rem" }}>
          <h3>{editingPet ? "Editar mascota" : "Nueva mascota"}</h3>
          <form onSubmit={handlePetSubmit} className="form">
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
              <small className="form__hint">Selecciona la unidad de tiempo (meses o años)</small>
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
              Fotos de la mascota {!editingPet && "*"} (puedes subir varias)
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                multiple
                required={!editingPet && petPhotos.length === 0}
                style={{ marginTop: "0.5rem" }}
              />
              <small style={{ display: "block", marginTop: "0.25rem", color: "#64748b" }}>
                Formatos aceptados: JPG, PNG, GIF. Tamaño máximo: 5MB por imagen. Se convertirán automáticamente a JPG y se optimizarán.
              </small>
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
              {editingPet && editingPet.photos && editingPet.photos.length > 0 && photoPreviews.length === 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem" }}>
                    Fotos actuales:
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {editingPet.photos.map((photo, index) => (
                      <img 
                        key={index}
                        src={photo.photo_url || photo.photo} 
                        alt={`${editingPet.name} ${index + 1}`} 
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
                {editingPet ? "Guardar cambios" : "Crear mascota"}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setShowPetForm(false);
                  setEditingPet(null);
                  setPetPhotos([]);
                  setPhotoPreviews([]);
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="loading">Cargando mascotas...</p>}
      {error && <p className="form__error">{error}</p>}

      {!loading && !error && pets.length === 0 && (
        <p>No hay mascotas registradas todavía.</p>
      )}

      <div className="pet-grid">
        {pets.map((pet) => (
          <article key={pet.id} className="pet-card">
            {pet.photos && pet.photos.length > 0 ? (
              <div style={{ position: "relative", width: "100%", height: "200px", overflow: "hidden", borderRadius: "0.5rem 0.5rem 0 0" }}>
                <img 
                  src={pet.photos[0].photo_url || pet.photos[0].photo} 
                  alt={pet.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {pet.photos.length > 1 && (
                  <div style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    background: "rgba(0,0,0,0.6)",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "0.75rem"
                  }}>
                    +{pet.photos.length - 1} más
                  </div>
                )}
              </div>
            ) : pet.photo ? (
              <img 
                src={getMediaUrl(pet.photo)} 
                alt={pet.name}
                style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "0.5rem 0.5rem 0 0" }}
              />
            ) : (
              <div className="pet-card__placeholder">
                <span role="img" aria-label="pet">
                  🐶
                </span>
              </div>
            )}
            <div>
              <h3>{pet.name}</h3>
              <p className="pet-card__type">
                {pet.pet_type === "dog" ? "Perro" : "Gato"} · {pet.age_display || (pet.age ? `${pet.age} ${pet.age_unit === "months" ? (pet.age === 1 ? "mes" : "meses") : (pet.age === 1 ? "año" : "años")}` : "Edad N/D")}
              </p>
              <p className="pet-card__desc">{pet.description || "Sin descripción"}</p>
              <p className="pet-card__status">
                Estado: <strong>{pet.status}</strong>
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                {canRequestAdoption(pet) && (
                  <button
                    className="btn btn--primary"
                    style={{ fontSize: "0.9rem" }}
                    onClick={() => setShowAdoptionForm(pet.id)}
                  >
                    💌 Solicitar adopción
                  </button>
                )}
                {isClient && getAdoptionRequest(pet.id) && (
                  <div
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "0.5rem",
                      backgroundColor: "#f8fafc",
                      border: `1px solid ${getStatusColor(getAdoptionRequest(pet.id).status)}`,
                      color: getStatusColor(getAdoptionRequest(pet.id).status),
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                  >
                    Estado: {getStatusLabel(getAdoptionRequest(pet.id).status)}
                  </div>
                )}
                {!isAuthenticated && pet.status === "available" && (
                  <Link to="/login" className="btn btn--primary" style={{ fontSize: "0.9rem" }}>
                    Inicia sesión para solicitar adopción
                  </Link>
                )}
                {canEditPet(pet) && (
                  <>
                    <button
                      className="btn btn--ghost"
                      style={{ fontSize: "0.9rem" }}
                      onClick={() => {
                        setEditingPet(pet);
                        setPetPhotos([]);
                        setPhotoPreviews([]);
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
                        setShowPetForm(true);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn--danger"
                      style={{ fontSize: "0.9rem" }}
                      onClick={() => handleDeletePet(pet.id)}
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </div>
              {showAdoptionForm === pet.id && (
                <div style={{ marginTop: "1rem", padding: "1rem", background: "#f8fafc", borderRadius: "0.5rem" }}>
                  <label>
                    Mensaje (opcional)
                    <textarea
                      value={adoptionMessage}
                      onChange={(e) => setAdoptionMessage(e.target.value)}
                      rows="3"
                      style={{ width: "100%", marginTop: "0.5rem" }}
                      placeholder="Escribe tu mensaje aquí..."
                    />
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <button
                      className="btn btn--primary"
                      style={{ fontSize: "0.9rem" }}
                      onClick={() => handleCreateAdoption(pet.id)}
                    >
                      Enviar solicitud
                    </button>
                    <button
                      className="btn btn--ghost"
                      style={{ fontSize: "0.9rem" }}
                      onClick={() => {
                        setShowAdoptionForm(null);
                        setAdoptionMessage("");
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
