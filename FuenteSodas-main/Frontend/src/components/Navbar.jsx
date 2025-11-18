import React, { useState } from "react";
import { FaShoppingCart, FaUserCircle, FaClipboardList } from "react-icons/fa";
import "./Navbar.css";
import Logo from "../assets/logo_naomi.jpeg";
import { useUserStore } from "../store/useUserStore";

function Navbar({ onRegisterClick, onLoginClick, onChangePasswordClick, onNavigate, views, isUserLoggedIn, userName, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
    const userInfo = useUserStore((state) => state.userInfo);
    
    // Usar la información reactiva
    const userNameStore = userInfo?.nombre || "Invitado";
    
    console.log("Navbar - isLoggedIn (Reactive):", isLoggedIn);

  const handleViewHistory = () => {
    onNavigate(views.HISTORIAL);
    setDropdownOpen(false);
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        {<img src={Logo} alt="Fuente de Soda Naomi" className="logo-img" />}
      </div>
      <div className="navbar-links">
        <a href="#" onClick={() => onNavigate(views.CATALOGO)}>INICIO</a>
        <a href="#" onClick={() => onNavigate(views.CATALOGO)}>LA CARTA</a>
        <a href="#nosotros">NOSOTROS</a>
        <a href="#contacto">CONTACTO</a>
      </div>
      <div className="navbar-icons">
      {isLoggedIn && (
          <button
              className="icon-button"
              onClick={handleViewHistory}
          >
              <FaClipboardList />
          </button>
      )} 
      <button
            className="icon-button"
            onClick={() => onNavigate(views.CARRITO)}
          >
            <FaShoppingCart />
          </button>

        <div className="user-menu-container">
          <button
            className="icon-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {isLoggedIn ? <FaUserCircle /> : <FaUserCircle />}
          </button>

          {/* Menú desplegable */}
          {dropdownOpen && (
            <div className="user-dropdown">
              {isLoggedIn ? (
                <>
                  <span>Hola, {userNameStore}</span>
                  <button
                    onClick={() => {
                      onChangePasswordClick();
                      setDropdownOpen(false);
                    }}
                  >
                    Cambiar Contraseña
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setDropdownOpen(false);
                    }}
                  >
                    Cerrar Sesión
                  </button>
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
