// src/components/PaymentSuccessModal.jsx
import React from 'react';

const PagoConfirmado = ({ amount, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content success">
        <div className="modal-header">
          <h2>Pago confirmado 🎉</h2>
          <button className="modal-close-btn" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="success-icon">✔</div>
          <p>Tu pago se ha procesado correctamente.</p>
          {amount != null && (
            <p>
              Monto pagado: <strong>S/. {amount.toFixed(2)}</strong>
            </p>
          )}
          <button className="checkout-button" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PagoConfirmado;