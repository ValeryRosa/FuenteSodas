import React from "react";
import LoginForm from "./LoginForm.jsx";
import "./RegisterModal.css";

function LoginModal({ isOpen, onClose, loginType, onLoginSuccess }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <LoginForm loginType={loginType} onLoginSuccess={onLoginSuccess} />
      </div>
    </div>
  );
}
export default LoginModal;
