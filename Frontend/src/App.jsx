import React, { useState } from 'react';
import Navbar from './components/Navbar';
import RegisterModal from './components/RegisterModal';
import './App.css';

function App() {
  //Visibilidad del modal de registro
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);

  // Funciones para abrir los modales
  const handleOpenRegister = () => setRegisterModalOpen(true);
  const handleOpenLogin = () => {
    alert("Modal de Login (Aún por implementar)");
  };
    
  // Función para cerrar el modal
  const handleCloseRegister = () => setRegisterModalOpen(false);

  return (
    <div className="App">
      <Navbar 
        onRegisterClick={handleOpenRegister}
        onLoginClick={handleOpenLogin}
      />

      <main>
        <h2></h2>
      </main>

      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={handleCloseRegister} 
      />
    
    </div>
  );
}

export default App;