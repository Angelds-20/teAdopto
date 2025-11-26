import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    role: "client",
    shelter_name: "",
    shelter_address: "",
  });
  const [registerState, setRegisterState] = useState({ loading: false, error: null, success: false });
  const [fieldErrors, setFieldErrors] = useState({});
  
  const validateField = (name, value) => {
    const errors = { ...fieldErrors };
    
    if (name === "username") {
      if (!value) {
        errors.username = "El nombre de usuario es requerido.";
      } else if (!/^[a-zA-Z0-9\s_-]{3,30}$/.test(value)) {
        errors.username = "3-30 caracteres, letras, números, espacios, guiones (-) y guiones bajos (_). Ejemplo: Juan Pérez";
      } else {
        delete errors.username;
      }
    }
    
    if (name === "shelter_name") {
      if (registerForm.role === "shelter" && !value.trim()) {
        errors.shelter_name = "El nombre del refugio es requerido.";
      } else {
        delete errors.shelter_name;
      }
    }
    
    if (name === "shelter_address") {
      if (registerForm.role === "shelter" && !value.trim()) {
        errors.shelter_address = "La dirección del refugio es requerida.";
      } else {
        delete errors.shelter_address;
      }
    }
    
    if (name === "email") {
      if (!value) {
        errors.email = "El correo electrónico es requerido.";
      } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        errors.email = "Formato inválido. Ejemplo: juan.perez@ejemplo.com";
      } else {
        delete errors.email;
      }
    }
    
    if (name === "password") {
      if (!value) {
        errors.password = "La contraseña es requerida.";
      } else if (value.length < 8) {
        errors.password = "Mínimo 8 caracteres.";
      } else if (!/[A-Za-z]/.test(value)) {
        errors.password = "Debe contener al menos una letra.";
      } else if (!/[0-9]/.test(value)) {
        errors.password = "Debe contener al menos un número.";
      } else {
        delete errors.password;
      }
    }
    
    if (name === "phone" && value) {
      if (!/^(\+?[0-9]{10,15}|[0-9]{10})$/.test(value)) {
        errors.phone = "10 dígitos o formato internacional (+ seguido de 10-15 dígitos). Ejemplo: +1234567890";
      } else {
        delete errors.phone;
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleFieldChange = (name, value) => {
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  if (isAuthenticated) {
    return (
      <section className="card form-card">
        <h2>Ya tienes sesión iniciada</h2>
        <p>Si deseas crear una nueva cuenta, primero cierra sesión.</p>
        <div className="hero-card__actions">
          <button type="button" className="btn btn--ghost" onClick={() => navigate("/")}>
            Volver al inicio
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="card form-card" style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h2>💝 Regístrate</h2>
      <p>Crea una cuenta gratuita como adoptador para adoptar mascotas o como refugio para publicar mascotas en adopción.</p>
      
      {registerState.success ? (
        <div>
          <p className="form__success">¡Registro exitoso!</p>
          <p style={{ marginTop: "0.5rem", color: "#475569" }}>
            Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión.
          </p>
          <Link to="/login" className="btn btn--primary" style={{ marginTop: "1rem" }}>
            Ir a iniciar sesión
          </Link>
        </div>
      ) : (
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            
            // Validar todos los campos
            const isUsernameValid = validateField("username", registerForm.username);
            const isEmailValid = validateField("email", registerForm.email);
            const isPasswordValid = validateField("password", registerForm.password);
            const isPhoneValid = registerForm.phone ? validateField("phone", registerForm.phone) : true;
            const isShelterNameValid = registerForm.role === "shelter" ? validateField("shelter_name", registerForm.shelter_name) : true;
            const isShelterAddressValid = registerForm.role === "shelter" ? validateField("shelter_address", registerForm.shelter_address) : true;
            
            if (!isUsernameValid || !isEmailValid || !isPasswordValid || !isPhoneValid || !isShelterNameValid || !isShelterAddressValid) {
              setRegisterState({ loading: false, error: "Por favor, corrige los errores en el formulario.", success: false });
              return;
            }
            
            setRegisterState({ loading: true, error: null, success: false });
            setFieldErrors({});
            
            try {
              const formData = {
                username: registerForm.username.trim(),
                email: registerForm.email.trim(),
                password: registerForm.password,
                phone: registerForm.phone?.trim() || "",
                role: registerForm.role || "client",
              };
              
              if (registerForm.role === "shelter") {
                formData.shelter_name = registerForm.shelter_name.trim();
                formData.shelter_address = registerForm.shelter_address.trim();
              }
              
              const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/";
              const response = await axios.post(`${API_BASE_URL}users/`, formData);
              
              if (response.status === 201 || response.status === 200) {
                setRegisterState({ loading: false, error: null, success: true });
                setRegisterForm({ username: "", email: "", password: "", phone: "", role: "client", shelter_name: "", shelter_address: "" });
                setFieldErrors({});
              }
            } catch (error) {
              console.error("Error al registrar:", error);
              let detail = "Error al registrar. Verifica los datos.";
              const newFieldErrors = {};
              
              if (error.response) {
                const data = error.response.data;
                if (data.username) {
                  const msg = Array.isArray(data.username) ? data.username[0] : data.username;
                  newFieldErrors.username = msg;
                  detail = msg;
                }
                if (data.email) {
                  const msg = Array.isArray(data.email) ? data.email[0] : data.email;
                  newFieldErrors.email = msg;
                  if (!detail.includes("usuario")) detail = msg;
                }
                if (data.password) {
                  const msg = Array.isArray(data.password) ? data.password[0] : data.password;
                  newFieldErrors.password = msg;
                  if (!detail.includes("usuario") && !detail.includes("correo")) detail = msg;
                }
                if (data.phone) {
                  const msg = Array.isArray(data.phone) ? data.phone[0] : data.phone;
                  newFieldErrors.phone = msg;
                }
                if (data.shelter_name) {
                  const msg = Array.isArray(data.shelter_name) ? data.shelter_name[0] : data.shelter_name;
                  newFieldErrors.shelter_name = msg;
                  if (!detail.includes("usuario") && !detail.includes("correo") && !detail.includes("contraseña")) detail = msg;
                }
                if (data.shelter_address) {
                  const msg = Array.isArray(data.shelter_address) ? data.shelter_address[0] : data.shelter_address;
                  newFieldErrors.shelter_address = msg;
                  if (!detail.includes("usuario") && !detail.includes("correo") && !detail.includes("contraseña") && !detail.includes("nombre")) detail = msg;
                }
                if (data.detail && !Object.keys(newFieldErrors).length) {
                  detail = Array.isArray(data.detail) ? data.detail[0] : data.detail;
                }
                if (data.non_field_errors && !Object.keys(newFieldErrors).length) {
                  detail = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
                }
              } else if (error.request) {
                detail = "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.";
              }
              
              setFieldErrors(newFieldErrors);
              setRegisterState({ loading: false, error: detail, success: false });
            }
          }}
        >
          <label>
            Usuario *
            <input
              type="text"
              name="username"
              value={registerForm.username}
              onChange={(e) => handleFieldChange("username", e.target.value)}
              onBlur={(e) => validateField("username", e.target.value)}
              required
              placeholder="ejemplo_usuario"
              pattern="[a-zA-Z0-9\s_-]{3,30}"
              title="3-30 caracteres, letras, números, espacios, guiones (-) y guiones bajos (_)"
            />
            {fieldErrors.username && (
              <span className="form__field-error">{fieldErrors.username}</span>
            )}
            <small className="form__hint">Ejemplo: Juan Pérez (3-30 caracteres, letras, números, espacios, - y _)</small>
          </label>
          <label>
            Email *
            <input
              type="email"
              name="email"
              value={registerForm.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              onBlur={(e) => validateField("email", e.target.value)}
              required
              placeholder="ejemplo@email.com"
              pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
              title="Formato: usuario@dominio.com"
            />
            {fieldErrors.email && (
              <span className="form__field-error">{fieldErrors.email}</span>
            )}
            <small className="form__hint">Ejemplo: juan.perez@ejemplo.com</small>
          </label>
          <label>
            Contraseña *
            <input
              type="password"
              name="password"
              value={registerForm.password}
              onChange={(e) => handleFieldChange("password", e.target.value)}
              onBlur={(e) => validateField("password", e.target.value)}
              required
              placeholder="Ingresa tu contraseña"
              minLength="8"
            />
            {fieldErrors.password && (
              <span className="form__field-error">{fieldErrors.password}</span>
            )}
            <small className="form__hint">Mínimo 8 caracteres, debe incluir letras y números. Ejemplo: MiPass123</small>
          </label>
          <label>
            Teléfono (opcional)
            <input
              type="tel"
              name="phone"
              value={registerForm.phone}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
              onBlur={(e) => validateField("phone", e.target.value)}
              placeholder="+56912345678"
              pattern="(\+?[0-9]{10,15}|[0-9]{10})"
              title="10 dígitos o formato internacional (+ seguido de 10-15 dígitos)"
            />
            {fieldErrors.phone && (
              <span className="form__field-error">{fieldErrors.phone}</span>
            )}
            <small className="form__hint">Ejemplo: +1234567890 o 1234567890 (10 dígitos)</small>
          </label>
          <label>
            Tipo de cuenta *
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="role"
                  value="client"
                  checked={registerForm.role === "client"}
                  onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value, shelter_name: "", shelter_address: "" })}
                  required
                />
                <span>Adoptador</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="role"
                  value="shelter"
                  checked={registerForm.role === "shelter"}
                  onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                  required
                />
                <span>Refugio</span>
              </label>
            </div>
            <small className="form__hint">Selecciona si quieres adoptar mascotas o registrar un refugio</small>
          </label>
          {registerForm.role === "shelter" && (
            <>
              <label>
                Nombre del refugio *
                <input
                  type="text"
                  name="shelter_name"
                  value={registerForm.shelter_name}
                  onChange={(e) => handleFieldChange("shelter_name", e.target.value)}
                  onBlur={(e) => validateField("shelter_name", e.target.value)}
                  required={registerForm.role === "shelter"}
                  placeholder="Ejemplo: Refugio Central"
                  maxLength={200}
                />
                {fieldErrors.shelter_name && (
                  <span className="form__field-error">{fieldErrors.shelter_name}</span>
                )}
                <small className="form__hint">Ejemplo: Refugio Central</small>
              </label>
              <label>
                Dirección del refugio *
                <input
                  type="text"
                  name="shelter_address"
                  value={registerForm.shelter_address}
                  onChange={(e) => handleFieldChange("shelter_address", e.target.value)}
                  onBlur={(e) => validateField("shelter_address", e.target.value)}
                  required={registerForm.role === "shelter"}
                  placeholder="Ejemplo: Av. Providencia 3312"
                />
                {fieldErrors.shelter_address && (
                  <span className="form__field-error">{fieldErrors.shelter_address}</span>
                )}
                <small className="form__hint">Ejemplo: Av. Providencia 3312</small>
              </label>
            </>
          )}
          {registerState.error && (
            <p className="form__error">{registerState.error}</p>
          )}
          <button
            type="submit"
            className="btn btn--primary"
            disabled={registerState.loading}
          >
            {registerState.loading ? "Registrando..." : "Crear cuenta"}
          </button>
        </form>
      )}
      
      <p className="form__hint" style={{ marginTop: "1.5rem", textAlign: "center" }}>
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" style={{ color: "#2563eb", textDecoration: "underline" }}>
          Inicia sesión aquí
        </Link>
      </p>
    </section>
  );
}

