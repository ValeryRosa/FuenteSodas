import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import RegisterModal from './components/RegisterModal.jsx';
import CrearPersonalForm from './components/Crearpersonal.jsx';
import Footer from './components/Footer.jsx';
import LoginModal from './components/LoginModal.jsx';
import './App.css';

function App() {

  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [loginType, setLoginType] = useState('cliente');
  const [currentUser, setCurrentUser] = useState(null);
  const handleOpenRegister = () => setRegisterModalOpen(true);
  const handleCloseRegister = () => setRegisterModalOpen(false);
  const handleCloseLogin = () => setLoginModalOpen(false);

  // Función para el Navbar (Login de Cliente)
  const handleOpenClienteLogin = () => {
    setLoginType('cliente');
    setLoginModalOpen(true);
  };

  // Función para el Footer (Login de Personal)
  const handleOpenPersonalLogin = () => {
    setLoginType('personal');
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
          onLogout={handleLogout} // <-- Pasamos la función de logout
      />

      <main>
        {!currentUser ? (
          <>
          <h2>Contenido de la página (Inicio, Carta, etc.)</h2>
          <hr /><hr />
          </>
        ) : (

          <div>
            <h1>¡Bienvenido, {currentUser.nombre}!</h1>
            {currentUser.rol === 'cliente' && (
              <h2>Soy Cliente</h2>
            )}
            {currentUser.rol === 'administrador' && (
              <>
              <h2>Soy Administrador</h2>
              <p>Aquí puedes ver el formulario para crear personal:</p>
              <CrearPersonalForm />
              </>
            )}
            {currentUser.rol === 'operador' && (
              <h2>Soy Operador de Pedidos</h2>
            )}
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
        onLoginSuccess={handleLoginSuccess} // <-- ¡NUEVO! Pasamos la función
      />
      <Footer 
        onLoginClick={handleOpenPersonalLogin} 
      />
    </div>
  )
}

export default App;