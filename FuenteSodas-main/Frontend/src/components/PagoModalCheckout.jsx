// src/components/PagoModalCheckout.jsx
import React, { useState } from 'react';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useUserStore } from '../store/useUserStore';

const PagoModalCheckout = ({ apiCheckoutUrl, onClose, onSuccess, onFailure }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const currentUser = useUserStore.getState().userInfo;
  console.log("PagoModalCheckout - currentUser:", currentUser);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setErrorMessage('');
    setIsProcessing(true);

    // Validar el formulario (PaymentElement)
    const { error: submitError } = await elements.submit();
    if (submitError?.message) {
      setErrorMessage(submitError.message);
      setIsProcessing(false);
      return;
    }

    // Confirmar el pago (sin redirigir siempre)
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: apiCheckoutUrl, // por si requiere redirect (3DS, etc.)
      },
      redirect: 'if_required',
    });

    if (error) {
      const msg = error.message || 'Ocurrió un error al procesar el pago.';
      setErrorMessage(msg);
      setIsProcessing(false);
      if (onFailure) {
        onFailure(msg);
      }
      return;
    }

    // Si no hay error y no fue necesario redirigir, revisamos el estado
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      if (onSuccess) {
        onSuccess(paymentIntent);
      }
    } else {
      const msg = 'El pago no se completó correctamente.';
      setErrorMessage(msg);
      if (onFailure) {
        onFailure(msg);
      }
    }

    setIsProcessing(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Header del modal */}
        <div className="modal-header">
          <h2>Completar pago</h2>
          <button className="modal-close-btn" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Cuerpo del modal */}
        <form onSubmit={handleSubmit} className="modal-body px-4">
          <PaymentElement />
          <button
            type="submit"
            disabled={!stripe || !elements || isProcessing}
            className="checkout-button"
          >
            {isProcessing ? 'Procesando...' : 'Pagar'}
          </button>

          {errorMessage && (
            <div style={{ color: 'red', marginTop: '8px' }}>
              {errorMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PagoModalCheckout;