import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { getMediaUrl } from "../utils/media";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState({ pets: 0, shelters: 0, adoptions: 0 });
  const [statsState, setStatsState] = useState({ loading: false, error: null });
  const [pets, setPets] = useState([]);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [petsLoading, setPetsLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Cargar mascotas para el carousel
  useEffect(() => {
    const fetchPets = async () => {
      setPetsLoading(true);
      try {
        const petsRes = await api.get("pets/");
        // Filtrar solo mascotas disponibles
        const petsData = petsRes.data.results || [];
        const availablePets = petsData.filter(pet => pet.status === "available");
        setPets(availablePets);
      } catch (err) {
        console.error("Error al cargar mascotas:", err);
        setPets([]);
      } finally {
        setPetsLoading(false);
      }
    };
    fetchPets();
  }, []);

  // Detectar cambios en el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-rotación del carousel cada 5 segundos
  useEffect(() => {
    if (pets.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentPetIndex((prevIndex) => (prevIndex + 1) % pets.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [pets.length]);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsState({ loading: true, error: null });

      // Inicializar con valores por defecto
      let petsCount = 0;
      let sheltersCount = 0;
      let adoptionsCount = 0;
      let hasError = false;
      let errorMessages = [];

      // Cargar mascotas (público)
      try {
        const petsRes = await api.get("pets/");
        petsCount = petsRes.data.count || 0;
      } catch (err) {
        console.error("Error al cargar mascotas:", err);
        console.error("Detalles del error:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          url: err.config?.url
        });
        hasError = true;
        errorMessages.push("mascotas");
      }

      // Cargar refugios (público)
      try {
        const sheltersRes = await api.get("shelters/");
        sheltersCount = sheltersRes.data.count || (Array.isArray(sheltersRes.data) ? sheltersRes.data.length : 0);
      } catch (err) {
        console.error("Error al cargar refugios:", err);
        console.error("Detalles del error:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          url: err.config?.url
        });
        hasError = true;
        errorMessages.push("refugios");
      }

      // Cargar adopciones solo si está autenticado
      if (isAuthenticated) {
        try {
          const adoptionsRes = await api.get("adoptions/");
          adoptionsCount = adoptionsRes.data.count || (Array.isArray(adoptionsRes.data) ? adoptionsRes.data.length : 0);
        } catch (err) {
          console.error("Error al cargar adopciones:", err);
          // No marcamos error si fallan las adopciones, solo no las mostramos
        }
      }

      // Actualizar estadísticas con lo que se pudo cargar
      setStats({
        pets: petsCount,
        shelters: sheltersCount,
        adoptions: adoptionsCount,
      });

      // Solo mostrar error si fallaron todas las métricas
      if (hasError && petsCount === 0 && sheltersCount === 0) {
        setStatsState({
          loading: false,
          error: `No se pudieron cargar las métricas de ${errorMessages.join(" y ")}. Verifica que el backend esté corriendo.`
        });
      } else {
        setStatsState({ loading: false, error: null });
      }
    };

    fetchStats();
  }, [isAuthenticated]);

  return (
    <section className="home">
      <div className="hero-card">
        <div>
          <p className="eyebrow">Plataforma colaborativa</p>
          <h1>
            <span className="hero-word hero-word--adoption">Adopción</span> segura. Un <span className="hero-word hero-word--home">hogar</span> para cada espera.
          </h1>
          <p className="hero-card__lead">
            Únete a nuestra comunidad y ayuda a las mascotas a encontrar un hogar lleno de amor.
            Explora perfiles detallados, conoce refugios verificados y forma parte de historias de adopción exitosas.
          </p>
          <div className="hero-card__actions">
            <Link className="btn btn--primary" to="/pets">
              🐾 Ver mascotas
            </Link>
            {!isAuthenticated && (
              <Link className="btn btn--ghost" to="/login">
                🔐 Iniciar sesión
              </Link>
            )}
          </div>
        </div>
        <div className="stats-card">
          <p>📊 Métricas en vivo</p>
          {statsState.loading && <p className="loading">Actualizando...</p>}
          {statsState.error && <p className="form__error">{statsState.error}</p>}
          {!statsState.loading && !statsState.error && (
            <ul>
              <li>
                <strong>{stats.pets}</strong>
                <span>Mascotas registradas</span>
              </li>
              <li>
                <strong>{stats.shelters}</strong>
                <span>Refugios activos</span>
              </li>
              {isAuthenticated ? (
                <li>
                  <strong>{stats.adoptions}</strong>
                  <span>Solicitudes de adopción</span>
                </li>
              ) : (
                <li>
                  <strong>-</strong>
                  <span>
                    <Link to="/login" style={{ color: "rgba(248, 250, 252, 0.8)", textDecoration: "underline" }}>
                      Inicia sesión
                    </Link>{" "}
                    para ver solicitudes
                  </span>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Widget dinámico de mascotas en adopción */}
      {pets.length > 0 && (
        <div className="card" style={{ marginTop: "3rem", padding: "0", overflow: "hidden" }}>
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "2rem",
            color: "white",
            textAlign: "center"
          }}>
            <p className="eyebrow" style={{ color: "rgba(255,255,255,0.9)", marginBottom: "0.5rem" }}>
              🐾 Mascotas buscando hogar
            </p>
            <h2 style={{ margin: "0.5rem 0", color: "white" }}>Conoce a nuestros amigos</h2>
            <p style={{ margin: "0.5rem 0 0", opacity: 0.9 }}>
              {pets.length} {pets.length === 1 ? "mascota disponible" : "mascotas disponibles"} para adopción
            </p>
          </div>

          <div style={{ position: "relative", minHeight: "400px" }}>
            {petsLoading ? (
              <div style={{ padding: "3rem", textAlign: "center" }}>
                <p>Cargando mascotas...</p>
              </div>
            ) : (
              <>
                {pets.map((pet, index) => {
                  const isActive = index === currentPetIndex;
                  const petPhoto = pet.photos && pet.photos.length > 0
                    ? (pet.photos[0].photo_url || pet.photos[0].photo)
                    : (pet.photo ? getMediaUrl(pet.photo) : null);

                  return (
                    <div
                      key={pet.id}
                      style={{
                        display: isActive ? "block" : "none",
                        padding: "2rem",
                      }}
                    >
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: windowWidth < 768 ? "1fr" : "1fr 1fr",
                        gap: "2rem",
                        alignItems: "center"
                      }}>
                        <div style={{
                          borderRadius: "1rem",
                          overflow: "hidden",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                        }}>
                          {petPhoto ? (
                            <img
                              src={petPhoto}
                              alt={pet.name}
                              style={{
                                width: "100%",
                                height: "350px",
                                objectFit: "cover",
                                display: "block"
                              }}
                            />
                          ) : (
                            <div style={{
                              width: "100%",
                              height: "350px",
                              background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "4rem"
                            }}>
                              {pet.pet_type === "dog" ? "🐶" : "🐱"}
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ marginBottom: "1rem" }}>
                            <span style={{
                              display: "inline-block",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "1rem",
                              background: pet.pet_type === "dog" ? "#3b82f6" : "#f59e0b",
                              color: "white",
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              marginBottom: "0.5rem"
                            }}>
                              {pet.pet_type === "dog" ? "🐶 Perro" : "🐱 Gato"}
                            </span>
                          </div>
                          <h3 style={{ fontSize: "2rem", margin: "0.5rem 0", color: "#1e293b" }}>
                            {pet.name}
                          </h3>
                          {pet.breed && (
                            <p style={{ color: "#64748b", margin: "0.5rem 0", fontSize: "1.1rem" }}>
                              Raza: <strong>{pet.breed}</strong>
                            </p>
                          )}
                          {(pet.age || pet.size) && (
                            <p style={{ color: "#64748b", margin: "0.5rem 0" }}>
                              {pet.age && `Edad: ${pet.age_display || (pet.age ? `${pet.age} ${pet.age_unit === "months" ? (pet.age === 1 ? "mes" : "meses") : (pet.age === 1 ? "año" : "años")}` : "N/D")}`}
                              {pet.age && pet.size && " • "}
                              {pet.size && `Tamaño: ${pet.size}`}
                            </p>
                          )}
                          {pet.description && (
                            <p style={{
                              color: "#475569",
                              margin: "1rem 0",
                              lineHeight: "1.6",
                              fontSize: "1rem"
                            }}>
                              {pet.description.length > 150
                                ? `${pet.description.substring(0, 150)}...`
                                : pet.description}
                            </p>
                          )}
                          <div style={{ marginTop: "1.5rem" }}>
                            <Link
                              to="/pets"
                              className="btn btn--primary"
                              style={{ display: "inline-block" }}
                            >
                              Ver más detalles
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Controles del carousel */}
                {pets.length > 1 && (
                  <>
                    <button
                      type="button"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "1rem",
                        transform: "translateY(-50%)",
                        background: "rgba(255,255,255,0.9)",
                        border: "none",
                        borderRadius: "50%",
                        width: "48px",
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        transition: "all 0.2s",
                        zIndex: 10
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "white"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.9)"}
                      onClick={() => setCurrentPetIndex((prev) => (prev - 1 + pets.length) % pets.length)}
                      aria-label="Mascota anterior"
                    >
                      <span style={{ fontSize: "1.5rem", color: "#1e293b" }}>‹</span>
                    </button>
                    <button
                      type="button"
                      style={{
                        position: "absolute",
                        top: "50%",
                        right: "1rem",
                        transform: "translateY(-50%)",
                        background: "rgba(255,255,255,0.9)",
                        border: "none",
                        borderRadius: "50%",
                        width: "48px",
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        transition: "all 0.2s",
                        zIndex: 10
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "white"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.9)"}
                      onClick={() => setCurrentPetIndex((prev) => (prev + 1) % pets.length)}
                      aria-label="Siguiente mascota"
                    >
                      <span style={{ fontSize: "1.5rem", color: "#1e293b" }}>›</span>
                    </button>

                    {/* Indicadores de puntos */}
                    <div style={{
                      position: "absolute",
                      bottom: "1rem",
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      gap: "0.5rem",
                      zIndex: 10
                    }}>
                      {pets.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentPetIndex(index)}
                          style={{
                            width: index === currentPetIndex ? "24px" : "8px",
                            height: "8px",
                            borderRadius: "4px",
                            border: "none",
                            background: index === currentPetIndex ? "#667eea" : "rgba(0,0,0,0.2)",
                            cursor: "pointer",
                            transition: "all 0.3s",
                            padding: 0
                          }}
                          aria-label={`Ir a mascota ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="features-grid">
        <article className="feature-card">
          <div className="feature-icon">🏠</div>
          <h3>Refugios verificados</h3>
          <p>Conectamos con refugios confiables y verificados que cuidan de las mascotas con amor y profesionalismo.</p>
        </article>
        <article className="feature-card">
          <div className="feature-icon">💝</div>
          <h3>Adopción responsable</h3>
          <p>Proceso transparente y seguro para garantizar que cada mascota encuentre el hogar perfecto.</p>
        </article>
        <article className="feature-card">
          <div className="feature-icon">📸</div>
          <h3>Perfiles completos</h3>
          <p>Fotos, descripciones detalladas y toda la información que necesitas para conocer a tu futuro compañero.</p>
        </article>
        <article className="feature-card">
          <div className="feature-icon">🤝</div>
          <h3>Comunidad activa</h3>
          <p>Únete a una comunidad comprometida con el bienestar animal y la adopción responsable.</p>
        </article>
      </div>

      {!isAuthenticated && (
        <div className="card" style={{ marginTop: "3rem", textAlign: "center" }}>
          <h2>💝 ¿Listo para empezar?</h2>
          <p>Crea una cuenta gratuita para adoptar mascotas o registrar tu refugio.</p>
          <div className="hero-card__actions" style={{ justifyContent: "center", marginTop: "1.5rem" }}>
            <Link to="/register" className="btn btn--primary">
              Crear cuenta
            </Link>
            <Link to="/login" className="btn btn--ghost">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
