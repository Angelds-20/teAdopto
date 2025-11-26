import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Pets from "./pages/Pets";
import Shelters from "./pages/Shelters";
import Users from "./pages/Users";
import Adoptions from "./pages/Adoptions";
import Donations from "./pages/Donations";
import Angel from "./pages/Angel";
import NavBar from "./components/NavBar";
import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/angel" element={<Angel />} />
        <Route path="*" element={
          <>
            <NavBar />
            <main className="page-container">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/pets" element={<Pets />} />
                <Route path="/shelters" element={<Shelters />} />
                <Route path="/users" element={<Users />} />
                <Route path="/adoptions" element={<Adoptions />} />
                <Route path="/donations" element={<Donations />} />
              </Routes>
            </main>
            <footer className="app-footer">
              <p>© {new Date().getFullYear()} TeAdopto · Conectando corazones, encontrando hogares</p>
              <span>Hecho con ❤️ para ayudar a las mascotas a encontrar su familia</span>
            </footer>
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;
