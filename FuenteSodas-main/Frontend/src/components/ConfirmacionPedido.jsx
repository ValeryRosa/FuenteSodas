import React, { useState, useEffect } from 'react';
import './ConfirmacionPedido.css'; 

function ConfirmacionPedido() {
  const [pedidoId, setPedidoId] = useState(null);

  useEffect(() => {
    const idGuardado = localStorage.getItem('ultimoPedidoId');
    
    if (idGuardado) {
      setPedidoId(idGuardado);
    }
  }, []);

  return (
    <div className="confirmation-page">
      <div className="confirmation-box">
        <svg 
          className="checkmark" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 52 52"
        >
          <circle cx="26" cy="26" r="25" fill="none" />
          <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
        </svg>

        <h1>¡Pedido Realizado con Éxito!</h1>

        <p className="success-message">
          Tu orden ha sido confirmada y registrada. ¡Gracias por tu compra!
        </p>
        
        {/* 2. Mostrar el ID del pedido leído del estado */}
        <p className="order-reference">
          Referencia de tu pedido: 
          <strong>{pedidoId ? `#${pedidoId}` : 'Cargando...'}</strong>
        </p>

        <p className="details-info">
          Recibirás una confirmación por correo electrónico con los detalles.
        </p>

        <a href="/" className="back-home-button">
          Volver a la Tienda
        </a>
      </div>
    </div>
  );
}

export default ConfirmacionPedido;