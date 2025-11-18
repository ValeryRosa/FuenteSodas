import React, { useState } from "react";
import Navbar from "./components/Navbar.jsx";
import RegisterModal from "./components/RegisterModal.jsx";
import CrearPersonalForm from "./components/Crearpersonal.jsx";
import Footer from "./components/Footer.jsx";
import LoginModal from "./components/LoginModal.jsx";
import Catalogo from "./components/Catalogo.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import OperadorLayout from "./components/OperadorLayout.jsx";
import Carrito from "./components/Carrito.jsx";
import HistorialPedidos from "./components/HistorialPedidos.jsx";
import ChangePassModal from "./components/ChangePassModal.jsx";
import "./App.css";
import { useUserStore } from "./store/useUserStore.js";

const VIEWS = {
    CATALOGO: 'catalogo',
    CARRITO: 'carrito',
    HISTORIAL: 'historial'
};

function App() {
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [loginType, setLoginType] = useState("cliente");
  //const [currentUser, setCurrentUser] = useState(null);
  const handleOpenRegister = () => setRegisterModalOpen(true);
  const handleCloseRegister = () => setRegisterModalOpen(false);
  const handleCloseLogin = () => setLoginModalOpen(false);
  const [currentClientView, setCurrentClientView] = useState(VIEWS.CATALOGO);
  const [isChangePassModalOpen, setChangePassModalOpen] = useState(false);

  const userInfo = useUserStore((state) => state.userInfo);
    const isLoggedIn = useUserStore((state) => state.isLoggedIn);
    const userRole = useUserStore((state) => state.userInfo?.rol);
    const { setUserInfo, setIsLoggedIn } = useUserStore.getState();

  const handleOpenChangePassword = () => {
      if (useUserStore.getState().userInfo) {
          setChangePassModalOpen(true);
      }
  };
  const handleCloseChangePassword = () => setChangePassModalOpen(false);

    const navigateToClientView = (view) => {
        setCurrentClientView(view);
    };

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
    //setCurrentUser(usuario);
    //useUserStore.getState().setCurrentUser(usuario);
    handleCloseLogin();
  };

  const handleLogout = () => {
  setUserInfo(null); 
  setIsLoggedIn(false); 
  navigateToClientView(VIEWS.CATALOGO); 
};

    const renderClientContent = () => {
        if (currentClientView === VIEWS.HISTORIAL) {
            return (
                <>
                  <HistorialPedidos 
                      currentUser={userInfo}
                        onNavigate={navigateToClientView}
                        views={VIEWS}
                    /> 
                </>
            );
        }
        if (currentClientView === VIEWS.CARRITO) {
            return (
                <>
                  <Carrito 
                        onNavigate={navigateToClientView}
                        views={VIEWS}
                    /> 
                </>
            );
        }
        return (
            <>
                <Catalogo />
                <Footer onLoginClick={handleOpenPersonalLogin} />
            </>
        );
    };


    const isUserLoggedIn = isLoggedIn;
    const userName = userInfo?.nombre || "Invitado";

    console.log("isUserLoggedIn:", isUserLoggedIn);
    console.log("userName:", userName);

  return (
    <div className="App">
      <Navbar
        onRegisterClick={handleOpenRegister}
        onLoginClick={handleOpenClienteLogin}
        onLogout={handleLogout}
        onNavigate={navigateToClientView}
        views={VIEWS}
        onChangePasswordClick={handleOpenChangePassword}
      />

      <main>
        {/* Condición 1: 
          Si NO hay usuario logueado (!currentUser) 
          O si el usuario es un 'cliente' (currentUser.rol === 'cliente')
          ...entonces muestra el Catálogo.
        */}
        {!userInfo || userRole === "cliente" ? (
                    renderClientContent()
        ) : (
          /* Condición 2 (else): 
            Si SÍ hay un usuario y NO es un cliente (o sea, es admin u operador)
            ...entonces muestra sus paneles de bienvenida.
          */
          <div>
            <h1>¡Bienvenido, {userInfo.nombre}!</h1>
            {useUserStore.getState().userRole === "administrador" && (
              <AdminLayout currentUser={userInfo} onLogout={handleLogout} />
            )}
            {useUserStore.getState().userRole === "operador" && (
              <OperadorLayout currentUser={userInfo} onLogout={handleLogout} />
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
        onLoginSuccess={handleLoginSuccess}
      />

      {isUserLoggedIn && (
        <ChangePassModal
            isOpen={isChangePassModalOpen}
            onClose={handleCloseChangePassword}
            currentUser={userInfo}
        />
      )}

    </div>
  );
}

export default App;
