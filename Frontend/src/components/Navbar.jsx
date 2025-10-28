import React, { useState } from "react";
import { FaShoppingCart, FaUserCircle } from "react-icons/fa";
import "./Navbar.css";
import Logo from "../assets/logo_naomi.jpeg";

function Navbar({ onRegisterClick, onLoginClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isUserLoggedIn = false;
  const userName = "Valery";

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        {<img src={Logo} alt="Fuente de Soda Naomi" className="logo-img" />}
      </div>
      <div className="navbar-links">
        <a href="#inicio">INICIO</a>
        <a href="#carta">LA CARTA</a>
        <a href="#nosotros">NOSOTROS</a>
        <a href="#contacto">CONTACTO</a>
      </div>
      <div className="navbar-icons">
        <a href="#carrito" className="icon-button">
          <FaShoppingCart />
        </a>
        <div className="user-menu-container">
          <button
            className="icon-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {isUserLoggedIn ? <FaUserCircle /> : <FaUserCircle />}
          </button>

          {/* Menú desplegable */}
          {dropdownOpen && (
            <div className="user-dropdown">
              {isUserLoggedIn ? (
                <>
                  <span>Hola, {userName}</span>
                  <a href="#perfil">Cambiar Contraseña</a>
                  <a href="#logout">Cerrar Sesión</a>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onLoginClick();
                      setDropdownOpen(false);
                    }}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => {
                      onRegisterClick();
                      setDropdownOpen(false);
                    }}
                  >
                    Registrarse
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
