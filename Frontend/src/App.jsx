import React, { useState } from "react";
import Navbar from "./components/Navbar.jsx";
import RegisterModal from "./components/RegisterModal.jsx";
import CrearPersonalForm from "./components/Crearpersonal.jsx";
import Footer from "./components/Footer.jsx";
import LoginModal from "./components/LoginModal.jsx";
import Catalogo from "./components/Catalogo.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import "./App.css";

function App() {
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [loginType, setLoginType] = useState("cliente");
  const [currentUser, setCurrentUser] = useState(null);
  const handleOpenRegister = () => setRegisterModalOpen(true);
  const handleCloseRegister = () => setRegisterModalOpen(false);
  const handleCloseLogin = () => setLoginModalOpen(false);

  // Función para el Navbar (Login de Cliente)
  const handleOpenClienteLogin = () => {
    setLoginType("cliente");
    setLoginModalOpen(true);
  };

  // Función para el Footer (Login de Personal)
  const handleOpenPersonalLogin = () => {
    setLoginType("personal");
    setLoginModalOpen(true);
  };

  const handleLoginSuccess = (usuario) => {
    console.log("Usuario logueado:", usuario);
    setCurrentUser(usuario);
    handleCloseLogin();
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="App">
      <Navbar
        currentUser={currentUser}
        onRegisterClick={handleOpenRegister}
        onLoginClick={handleOpenClienteLogin}
        onLogout={handleLogout}
      />

      <main>
        {/* Condición 1: 
          Si NO hay usuario logueado (!currentUser) 
          O si el usuario es un 'cliente' (currentUser.rol === 'cliente')
          ...entonces muestra el Catálogo.
        */}
        {!currentUser || currentUser.rol === "cliente" ? (
          <>
            <Catalogo />
            <Footer onLoginClick={handleOpenPersonalLogin} />
          </>
        ) : (
          /* Condición 2 (else): 
            Si SÍ hay un usuario y NO es un cliente (o sea, es admin u operador)
            ...entonces muestra sus paneles de bienvenida.
          */
          <div>
            <h1>¡Bienvenido, {currentUser.nombre}!</h1>
            {currentUser.rol === "administrador" && (
              <AdminLayout currentUser={currentUser} onLogout={handleLogout} />
            )}
            {currentUser.rol === "operador" && <h2>Soy Operador de Pedidos</h2>}
          </div>
        )}
      </main>

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={handleCloseRegister}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLogin}
        loginType={loginType}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;
