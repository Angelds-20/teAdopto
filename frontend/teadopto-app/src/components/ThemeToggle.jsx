import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.6rem 1rem",
        }}
        aria-label="Configuración de tema"
      >
        <span>{isDark ? "🌙" : "☀️"}</span>
        <span style={{ fontSize: "0.875rem" }}>Tema</span>
      </button>
      
      {isOpen && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            className="card"
            style={{
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              right: 0,
              zIndex: 999,
              minWidth: "200px",
              padding: "1rem",
              boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            }}
          >
            <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem" }}>Ajustes de tema</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => {
                  if (theme !== "light") toggleTheme();
                  setIsOpen(false);
                }}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  border: theme === "light" ? "2px solid #f59e0b" : (isDark ? "2px solid #475569" : "2px solid #e2e8f0"),
                  background: theme === "light" ? "#eff6ff" : "transparent",
                  color: theme === "light" ? "#2563eb" : (isDark ? "#cbd5e1" : "#64748b"),
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontWeight: theme === "light" ? "600" : "400",
                  transition: "all 0.2s",
                  width: "100%",
                }}
              >
                <span>☀️</span>
                <span>Modo claro</span>
                {theme === "light" && <span style={{ marginLeft: "auto" }}>✓</span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (theme !== "dark") toggleTheme();
                  setIsOpen(false);
                }}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  border: theme === "dark" ? "2px solid #f59e0b" : (isDark ? "2px solid #475569" : "2px solid #e2e8f0"),
                  background: theme === "dark" ? (isDark ? "#334155" : "#1e293b") : "transparent",
                  color: theme === "dark" ? "#fbbf24" : (isDark ? "#cbd5e1" : "#64748b"),
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontWeight: theme === "dark" ? "600" : "400",
                  transition: "all 0.2s",
                  width: "100%",
                }}
              >
                <span>🌙</span>
                <span>Modo oscuro</span>
                {theme === "dark" && <span style={{ marginLeft: "auto" }}>✓</span>}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

