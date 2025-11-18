import React from 'react';
import RegisterForm from './RegisterForm';
import './RegisterModal.css';

function RegisterModal({ isOpen, onClose }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <RegisterForm onSuccessfulRegister={onClose} />
      </div>
    </div>
  );
}

export default RegisterModal;