import React from "react";
import "./RegisterModal.css";

function Modal({ isOpen, onClose, title, children }) {
  console.log("Intentando renderizar Modal. isOpen:", isOpen);
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
export default Modal;
