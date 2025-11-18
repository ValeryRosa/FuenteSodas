import React, { use, useState } from "react";
import "./LoginForm.css";
import axios from "axios";
import { useUserStore } from "../store/useUserStore";

const CustomModal = ({ title, message, onConfirm, onClose, showCancel = false, children }) => {
    if (!message && !children) return null;

    return (
        <div className="custom-modal-backdrop">
            <div className="custom-modal-content">
                <h3 className="custom-modal-title">{title}</h3>
                {message && <p className="custom-modal-message">{message}</p>}
                {children}
                <div className="custom-modal-actions">
                    {showCancel && (
                        <button onClick={onClose} className="btn btn-cancel">
                            Cancelar
                        </button>
                    )}
                    <button onClick={onConfirm} className="btn btn-confirm">
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    );
};

function LoginForm({ loginType, onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rol: loginType === "cliente" ? "cliente" : "operador",
  });

  const [error, setError] = useState("");

  const [modal, setModal] = useState({ visible: false, title: '', message: '', action: null, showCancel: false, onClose: null });

    const showAlert = (title, message) => {
        setModal({
            visible: true,
            title,
            message,
            action: () => setModal({ visible: false }), 
            showCancel: false,
            onClose: () => setModal({ visible: false }),
        });
    };

  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      email: "",
      password: "",
      rol: loginType === "cliente" ? "cliente" : "operador",
    }));
  }, [loginType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:3001/api/usuarios/login",
        formData
      );

      const usuario = response.data.usuario;

        useUserStore.getState().setIsLoggedIn(true);
                useUserStore.getState().setUserInfo(response.data.usuario);
                useUserStore.getState().setUserRole(response.data.usuario.rol || 'cliente');
                

            if (loginType === "cliente" && usuario) { 
                const nombreUsuario = usuario.nombre || usuario.email.split('@')[0]; 

              
                
                showAlert(
                    "¡Inicio de Sesión Exitoso!",
                    `👋 Bienvenido/a, ${nombreUsuario}. ¡Disfruta de tu experiencia de compra!`
                );
            }
            
            if (onLoginSuccess) {
                setTimeout(() => onLoginSuccess(usuario), 500); 
            }
        } catch (err) {
            console.error("Error en el login:", err.response?.data?.message);
            
            showAlert(
                "Error de Autenticación",
                err.response?.data?.message || "Error al iniciar sesión."
            );
            setError(err.response?.data?.message || "Error al iniciar sesión.");
        }
    };


  return (
    <div className="login-form-container">
      <h2>{loginType === "cliente" ? "Iniciar Sesión" : "Acceso Personal"}</h2>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label>Correo Electrónico:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Contraseña:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {loginType === "personal" && (
          <div className="form-group">
            <label>Seleccionar Rol:</label>
            <select
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              required
            >
              <option value="operador">Soy Operador</option>
              <option value="administrador">Soy Administrador</option>
            </select>
          </div>
        )}

        <button type="submit" className="submit-button">
          Ingresar
        </button>
      </form>
      {modal.visible && (
                <CustomModal
                    title={modal.title}
                    message={modal.message}
                    onConfirm={modal.action}
                    onClose={modal.onClose}
                    showCancel={modal.showCancel}
                />
            )}
    </div>
  );
}

export default LoginForm;
