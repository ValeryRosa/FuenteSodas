import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import RegisterModal from './components/RegisterModal.jsx';
import CrearPersonalForm from './components/Crearpersonal.jsx';
import './App.css';

function App() {
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
  const handleOpenRegister = () => setRegisterModalOpen(true);
  const handleOpenLogin = () => alert("Modal de Login (Aún por implementar)");
    
  const handleCloseRegister = () => setRegisterModalOpen(false);

  return (
    <div className="App">
      <Navbar 
        onRegisterClick={handleOpenRegister}
        onLoginClick={handleOpenLogin}
      />

      <main>
        <h2>Contenido de la página (Inicio, Carta, etc.)</h2>               
        <hr />
          <CrearPersonalForm /> 
        <hr />
      </main>

      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={handleCloseRegister} 
      />    
    </div>  
  );
  return (
    <div className="App">
      <Navbar 
        onRegisterClick={handleOpenRegister}
        onLoginClick={handleOpenLogin}
      />

      <main>
        <h2>Contenido de la página (Inicio, Carta, etc.)</h2>
        <hr />
          <CrearPersonalForm /> 
        <hr />
      </main>
    </div>
  );
}

export default App;