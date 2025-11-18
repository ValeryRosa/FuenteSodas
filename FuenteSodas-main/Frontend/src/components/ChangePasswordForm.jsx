import React, { useState } from "react";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./ChangePasswordForm.css";
import { API_BASE_URL } from '../utils/constants';

const CHANGE_PASS_URL = `${API_BASE_URL}/usuarios/cambiar-contrasena`; 

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

function ChangePasswordForm({ currentUser, onPasswordChangeSuccess }) {
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });

    // Estado para controlar la visibilidad de las contraseñas
    const [passwordVisibility, setPasswordVisibility] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    // 2. Estado para la validación y errores locales
    const [localError, setLocalError] = useState("");
    // 3. Estado para el modal de notificaciones
    const [modal, setModal] = useState({ visible: false, title: '', message: '', action: null });

    // Función para mostrar la alerta
    const showAlert = (title, message, callback) => {
        setModal({
            visible: true,
            title,
            message,
            action: () => {
                setModal({ visible: false });
                if (callback) callback();
            }, 
            showCancel: false,
            onClose: () => setModal({ visible: false }),
        });
    };

    const togglePasswordVisibility = (field) => {
        setPasswordVisibility(prev => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasswords((prevData) => ({
            ...prevData,
            [name]: value,
        }));
        setLocalError(""); 
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLocalError("");

        const { currentPassword, newPassword, confirmNewPassword } = passwords;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return setLocalError("Todos los campos de contraseña son obligatorios.");
        }
        if (newPassword !== confirmNewPassword) {
            return setLocalError("La nueva contraseña y la confirmación no coinciden.");
        }
        if (newPassword.length < 6) {
             return setLocalError("La nueva contraseña debe tener al menos 6 caracteres.");
        }
        if (currentPassword === newPassword) {
             return setLocalError("La nueva contraseña no puede ser igual a la actual.");
        }

        const userId = currentUser?.id || currentUser?.ID; 

        if (!userId) {
             return setLocalError("Error: No se encontró la información del usuario logueado.");
        }
        
        try {
            const response = await axios.put(
                `${CHANGE_PASS_URL}/${userId}`,
                {
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                }
                // Si usas tokens de autenticación, agrégalos aquí (ejemplo: { headers: { Authorization: `Bearer ${token}` } })
            );

            showAlert(
                "Contraseña Actualizada",
                "Su contraseña ha sido cambiada exitosamente.",
                () => {
                    setPasswords({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
                    if (onPasswordChangeSuccess) onPasswordChangeSuccess();
                }
            );

        } catch (err) {
            const errorMessage = err.response?.data?.message || "Error desconocido al intentar cambiar la contraseña.";
            showAlert("Error al Actualizar Contraseña", errorMessage);
        }
    };

    // Mostrar/Ocultar contraseña
     const renderPasswordField = (id, label, value, fieldName, visibilityKey) => (
        <div className="form-group" key={id}>
            <label htmlFor={id}>{label}:</label>
            <div className="password-input-wrapper">
                <input
                    id={id}
                    type={passwordVisibility[visibilityKey] ? "text" : "password"}
                    name={fieldName}
                    value={value}
                    onChange={handleChange}
                    required
                    className="form-input"
                />
                <span 
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility(visibilityKey)}
                    role="button"
                    aria-label={passwordVisibility[visibilityKey] ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                    {passwordVisibility[visibilityKey] ? <FaEyeSlash /> : <FaEye />}
                </span>
            </div>
        </div>
    );

    return (
        <div className="change-password-form-container">
            <h2 className="form-title">Cambiar Contraseña</h2>
            
            <form onSubmit={handleChangePassword} className="password-form">
                
                {renderPasswordField(
                    "currentPassword", 
                    "Contraseña Actual", 
                    passwords.currentPassword, 
                    "currentPassword", 
                    "current" // <-- Key de visibilidad
                )}

                {renderPasswordField(
                    "newPassword", 
                    "Nueva Contraseña", 
                    passwords.newPassword, 
                    "newPassword", 
                    "new"
                )}

                {renderPasswordField(
                    "confirmNewPassword", 
                    "Confirmar Nueva Contraseña", 
                    passwords.confirmNewPassword, 
                    "confirmNewPassword", 
                    "confirm"
                )}

                {localError && (
                    <p className="form-error">{localError}</p>
                )}

                <button 
                    type="submit" 
                    className="submit-button"
                >
                    Cambiar Contraseña
                </button>
            </form>
            {modal.visible && (
                <CustomModal
                    title={modal.title}
                    message={modal.message}
                    onConfirm={modal.action}
                    onClose={modal.action}
                />
            )}
        </div>
    );
}

export default ChangePasswordForm;