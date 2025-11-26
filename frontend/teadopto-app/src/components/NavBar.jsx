import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

export default function NavBar() {
  const { isAuthenticated, user, logout, isAdmin, isClient } = useAuth();

  return (
    <header className="nav">
      <div className="nav__brand">
        <span className="nav__logo">🐾</span>
        <div>
          <p className="nav__title">TeAdopto</p>
          <p className="nav__subtitle">Encuentra a tu mejor amigo</p>
        </div>
      </div>
      <nav className="nav__links">
        <NavLink to="/" className="nav__link">
          Inicio
        </NavLink>
        <NavLink to="/shelters" className="nav__link">
          Refugios
        </NavLink>
        <NavLink to="/pets" className="nav__link">
          Mascotas
        </NavLink>
        <NavLink to="/donations" className="nav__link">
          Donaciones
        </NavLink>
        {(isClient || isAdmin) && (
          <NavLink to="/adoptions" className="nav__link">
            Solicitudes
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/users" className="nav__link">
            Usuarios
          </NavLink>
        )}
        <ThemeToggle />
        {!isAuthenticated && (
          <NavLink to="/login" className="nav__link nav__link--primary">
            Iniciar sesión
          </NavLink>
        )}
        {isAuthenticated && (
          <button type="button" className="nav__link nav__link--ghost" onClick={logout}>
            {user?.username ? `Salir (${user.username})` : "Cerrar sesión"}
          </button>
        )}
      </nav>
    </header>
  );
}

