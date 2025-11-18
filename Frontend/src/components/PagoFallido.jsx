// src/components/PaymentErrorModal.jsx
import React from 'react';

const PagoFallido = ({ message, onRetry, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content error">
        <div className="modal-header">
          <h2>Pago no realizado ❌</h2>
          <button className="modal-close-btn" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="error-icon">!</div>
          <p>Ocurrió un problema al procesar tu pago.</p>
          {message && (
            <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>
              Detalle: <strong>{message}</strong>
            </p>
          )}

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button className="checkout-button" type="button" onClick={onRetry}>
              Intentar de nuevo
            </button>
            <button className="secondary-button" type="button" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagoFallido;