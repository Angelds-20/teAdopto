import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Link } from "react-router-dom";

export default function Donations() {
  const { isAuthenticated, isShelter, user } = useAuth();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [donationForm, setDonationForm] = useState({
    amount: "",
    donor_name: "",
    donor_email: "",
    donor_phone: "",
    message: "",
    shelter: "",
  });
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchShelters = async () => {
      try {
        const response = await api.get("shelters/");
        // Filtrar solo refugios verificados
        const verifiedShelters = (response.data || []).filter(s => s.verified);
        setShelters(verifiedShelters);
      } catch (err) {
        console.error("Error al cargar refugios:", err);
      }
    };
    fetchShelters();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDonationForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Aquí iría la lógica para enviar la donación
      // Por ahora simulamos el envío
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setDonationForm({
        amount: "",
        donor_name: "",
        donor_email: "",
        donor_phone: "",
        message: "",
        shelter: "",
      });
    } catch (err) {
      setError("Error al procesar la donación. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="adoptions">
      <header>
        <p className="eyebrow">💝 Apoya a nuestros refugios</p>
        <h2>Haz una donación</h2>
        <p>Tu contribución ayuda a los refugios a cuidar y encontrar hogares para las mascotas.</p>
      </header>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: windowWidth < 768 ? "1fr" : "1fr 1fr", 
        gap: "2rem",
        marginTop: "2rem"
      }}>
        {/* Formulario de donación */}
        <div className="card">
          <h3>Formulario de donación</h3>
          {success ? (
            <div style={{ 
              padding: "1.5rem", 
              background: "#f0fdf4", 
              borderRadius: "0.5rem",
              border: "1px solid #86efac",
              marginTop: "1rem"
            }}>
              <p style={{ color: "#166534", fontWeight: "500", margin: 0 }}>
                ✅ ¡Gracias por tu donación!
              </p>
              <p style={{ color: "#166534", marginTop: "0.5rem", fontSize: "0.875rem" }}>
                Tu generosidad hace la diferencia. Recibirás un correo de confirmación pronto.
              </p>
              <button
                type="button"
                className="btn btn--primary"
                style={{ marginTop: "1rem" }}
                onClick={() => setSuccess(false)}
              >
                Hacer otra donación
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="form">
              <label>
                Monto de la donación *
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.25rem", fontWeight: "500" }}>$</span>
                  <input
                    type="number"
                    name="amount"
                    value={donationForm.amount}
                    onChange={handleChange}
                    placeholder="0"
                    min="1"
                    step="1"
                    required
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "#64748b" }}>CLP</span>
                </div>
                <small className="form__hint">Ingresa el monto en pesos chilenos (CLP)</small>
              </label>

              {!isAuthenticated && (
                <>
                  <label>
                    Nombre del donante *
                    <input
                      type="text"
                      name="donor_name"
                      value={donationForm.donor_name}
                      onChange={handleChange}
                      placeholder="Ejemplo: Juan Pérez"
                      required={!isAuthenticated}
                    />
                  </label>
                  <label>
                    Email del donante *
                    <input
                      type="email"
                      name="donor_email"
                      value={donationForm.donor_email}
                      onChange={handleChange}
                      placeholder="ejemplo@email.com"
                      required={!isAuthenticated}
                    />
                  </label>
                  <label>
                    Teléfono del donante
                    <input
                      type="tel"
                      name="donor_phone"
                      value={donationForm.donor_phone}
                      onChange={handleChange}
                      placeholder="+56912345678"
                    />
                  </label>
                </>
              )}

              <label>
                Refugio a donar *
                <select
                  name="shelter"
                  value={donationForm.shelter}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona un refugio</option>
                  {shelters.map((shelter) => (
                    <option key={shelter.id} value={shelter.id}>
                      {shelter.name} {shelter.verified && "✓"}
                    </option>
                  ))}
                </select>
                <small className="form__hint">Solo se muestran refugios verificados</small>
              </label>

              <label>
                Mensaje (opcional)
                <textarea
                  name="message"
                  value={donationForm.message}
                  onChange={handleChange}
                  placeholder="Escribe tu mensaje aquí..."
                  rows="4"
                />
              </label>

              {error && <p className="form__error">{error}</p>}

              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading || shelters.length === 0}
              >
                {loading ? "Procesando..." : "Realizar donación"}
              </button>

              {!isAuthenticated && (
                <p className="form__hint" style={{ marginTop: "1rem", textAlign: "center" }}>
                  <Link to="/login" style={{ color: "#2563eb", textDecoration: "underline" }}>
                    Inicia sesión
                  </Link>{" "}
                  para agilizar el proceso
                </p>
              )}
            </form>
          )}
        </div>

        {/* Información sobre donaciones */}
        <div>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3>💝 ¿Por qué donar?</h3>
            <ul style={{ marginTop: "1rem", paddingLeft: "1.25rem" }}>
              <li>Ayudas a cubrir los costos de alimentación y cuidado</li>
              <li>Contribuyes a tratamientos veterinarios</li>
              <li>Apoyas la rehabilitación de mascotas</li>
              <li>Facilitas el proceso de adopción</li>
            </ul>
          </div>

          <div className="card">
            <h3>📋 Información importante</h3>
            <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#64748b" }}>
              <p style={{ marginBottom: "0.75rem" }}>
                <strong>Refugios verificados:</strong> Solo puedes donar a refugios que han sido verificados por nuestro equipo.
              </p>
              <p style={{ marginBottom: "0.75rem" }}>
                <strong>Proceso seguro:</strong> Todas las donaciones se procesan de forma segura y transparente.
              </p>
              <p style={{ marginBottom: "0.75rem" }}>
                <strong>Confirmación:</strong> Recibirás un correo de confirmación con los detalles de tu donación.
              </p>
              <p>
                <strong>Contacto:</strong> Si tienes preguntas, puedes contactar al refugio directamente desde su perfil.
              </p>
            </div>
          </div>

          {isShelter && (
            <div className="card" style={{ marginTop: "1.5rem", background: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <h3>🏠 Eres un refugio</h3>
              <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#1e40af" }}>
                Si deseas recibir donaciones, asegúrate de que tu refugio esté verificado por un administrador.
              </p>
              <Link to="/shelters" className="btn btn--primary" style={{ marginTop: "1rem" }}>
                Ver mi refugio
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

