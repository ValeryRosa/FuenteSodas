import React from 'react';
import ChangePasswordForm from "./ChangePasswordForm.jsx";
import "./RegisterModal.css";

function ChangePassModal({ isOpen, onClose, currentUser, onPasswordChangeSuccess }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <ChangePasswordForm currentUser={currentUser} onPasswordChangeSuccess={onPasswordChangeSuccess} />
      </div>
    </div>
  );
}

export default ChangePassModal;