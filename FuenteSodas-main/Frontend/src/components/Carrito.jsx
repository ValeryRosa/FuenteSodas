import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaMinusCircle, FaPlusCircle, FaTrash } from "react-icons/fa";
import "./Carrito.css";
import { API_BASE_URL } from "../utils/constants";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PagoConfirmado from "./PagoConfirmado";
import PagoFallido from "./PagoFallido";
import PagoModalCheckout from "./PagoModalCheckout";
import { useUserStore } from "../store/useUserStore";

const API_CARRO_URL = `${API_BASE_URL}/carrito`;
const API_CHECKOUT_URL = `${API_BASE_URL}/orden/finalizar`;
const API_PAYMENT_INTENT_URL = `${API_BASE_URL}/pagos/create-payment-intent`;
const stripePromiseGlobal = loadStripe(
  "pk_test_51SU1fhJ1Dyyxy6yqfnDMWeVnLlt6PlTVZe7u3oamhUxj7qXJROnwpiaTiGkHOQ4SwObbkZdcrtj8QjZBQC9yw7nI00yQ4nW1Fg"
);

const Carrito = ({ onNavigate, views }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subtotal, setSubtotal] = useState(0.0);
  const [totalPagar, setTotalPagar] = useState(0.0);

  const [checkoutMarked, setCheckoutMarked] = useState(false);
  const [optionsCheckout, setOptionsCheckout] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const currentUser = useUserStore.getState().userInfo;
  console.log("Carrito - currentUser:", currentUser);

  // estados para resultado de pago
  const [paymentStatus, setPaymentStatus] = useState("idle"); // 'idle' | 'success' | 'error'
  const [paymentError, setPaymentError] = useState("");
  const [lastPaymentIntent, setLastPaymentIntent] = useState(null);

  const updateCartState = useCallback((cartData) => {
        setItems(cartData.items || []);
        setSubtotal(cartData.subtotal || 0.0);
        setTotalPagar(cartData.total_a_pagar || 0.0);
  }, []);

  const fetchCartItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = useUserStore.getState().userInfo;
      if (!currentUser || !currentUser.id) {
        throw new Error("Usuario no autenticado.");
      }
      const response = await axios.get(`${API_CARRO_URL}/${currentUser.id}`);

      setItems(response.data.items || []);
      setSubtotal(response.data.subtotal || 0.0);
      setTotalPagar(response.data.total_a_pagar || 0.0);
    } catch (err) {
      console.error("Error al cargar el carrito:", err);
      setError("Necesitas iniciar sesión para ver el carrito.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  const updateQuantity = async (id, newQuantity) => {
    const userInfo = useUserStore.getState().userInfo;
    if (!userInfo || !userInfo.id) {
        alert("Debes iniciar sesión para actualizar el carrito.");
        return;
    }

    try {
        await axios.put(`${API_CARRO_URL}/actualizar`, {
            id_producto: id,
            cantidad: newQuantity,
            id_usuario: userInfo.id, 
        });

      fetchCartItems();
    } catch (err) {
      console.error("Error al actualizar la cantidad:", err);
      alert("Fallo al actualizar la cantidad del producto.");
    }
  };

  const incrementQuantity = (id, currentQuantity) =>
    updateQuantity(id, currentQuantity + 1);

  const decrementQuantity = (id, currentQuantity) =>
    updateQuantity(id, currentQuantity - 1);

  const removeItem = async (id) => {
    const userInfo = useUserStore.getState().userInfo;
    if (!userInfo || !userInfo.id) {
        alert("Debes iniciar sesión para eliminar productos.");
        return;
    }

    try {
      await axios.delete(`${API_CARRO_URL}/eliminar/${id}`, { 
             data: { id_usuario: userInfo.id }
        });
      fetchCartItems();
    } catch (err) {
      console.error("Error al eliminar el producto:", err);
      alert("Fallo al eliminar el producto del carrito.");
      
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;

   const userInfo = useUserStore.getState().getUserInfo();
    if (!userInfo || !userInfo.id) {
      alert("Debes iniciar sesión antes de proceder al pago.");
      return;
    }
    try {
      setPaymentStatus("idle");
      setPaymentError("");
      setLastPaymentIntent(null);

      const payload = {
        total_a_pagar: totalPagar * 100,
        id_cliente: userInfo.id,
      };

      const res = await axios.post(API_PAYMENT_INTENT_URL, payload);

      const clientSecret = res.data.clientSecret;
      if (!clientSecret) {
        throw new Error("No se recibió clientSecret desde el backend");
      }

      const optionsStripe = {
        clientSecret,
        appearance: {
          theme: "stripe",
        },
      };

      setOptionsCheckout(optionsStripe);
      setStripePromise(stripePromiseGlobal);
      setCheckoutMarked(true);
    } catch (err) {
      console.error(
        "Error en el checkout:",
        err.response?.data?.message || err.message
      );
      alert(
        `Fallo al proceder al pago: ${
          err.response?.data?.message || "Error de conexión."
        }`
      );
    }
  };

  const handleGoToCatalog = () => {
    onNavigate(views.CATALOGO);
  };

  const handleSendConfirmationEmail = async () => {
    try {

      const emailPayload = {
        email: currentUser.email,
        details: {
            amount: totalPagar,
            date: new Date().toLocaleString(),
            items: items,
        }
      };
      console.log("Enviando correo de confirmación a:", emailPayload);

      await axios.post(`${API_BASE_URL}/pagos/confirmar-pago`, emailPayload);

      console.log("Correo de confirmación enviado.");
    } catch (err) {
      console.error("Error al enviar el correo de confirmación:", err);
    }
  };

  const handleAddPedidoFinalizado = () => {
    try{

        const userInfo = useUserStore.getState().getUserInfo();
        const id_cliente = userInfo.id;
        const dataProcess = {
            total_a_pagar : totalPagar , id_cliente : id_cliente }
        axios.post(`${API_BASE_URL}/orden/finalizar`, dataProcess)
        .then((response) => {
            console.log("Pedido finalizado registrado:", response.data);
            updateCartState({ items: [], subtotal: 0.0, total_a_pagar: 0.0 });
        })
        .catch((error) => {
            console.error("Error al registrar el pedido finalizado:", error);
            const responseData = error.response?.data;
            let errorMessage = error.response?.data?.message || 'Error desconocido al finalizar el pedido.';

            if (error.response?.status === 409 && responseData?.items) {
              errorMessage = `Fallo de stock: ${errorMessage}`;
                updateCartState(responseData);
            } else {
              fetchCartItems();
            }
            
            setPaymentError(`Transacción fallida en el servidor: ${errorMessage}`);
            setPaymentStatus("error"); 
            setCheckoutMarked(false);
          });
        

    }catch (err) {
        alert("Error al registrar el pedido finalizado.");
        console.error("Error interno al preparar el pedido:", err);
        setPaymentError('Error de procesamiento. Intente nuevamente.');
        setPaymentStatus("error");
    }   
  }

  if (loading) {
    return (
      <div className="cart-container text-center py-10">
        Cargando carrito...
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-container text-center py-10 text-red-500">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-container cart-empty">
        <div className="cart-empty-message">
          <h2>Tu carrito está vacío</h2>
          <p>¡Parece que no has añadido productos aún!</p>
          <button className="cart-empty-button" onClick={handleGoToCatalog}>
            Ir al Catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1 className="cart-title">Tu Carrito de Compras</h1>
      <div className="cart-layout">
        {/* Ítems del Carrito */}
        <div className="cart-items-list">
          {items.map((item) => (
            <div key={item.id_producto} className="cart-item">
              <img
                src={
                  item.imagen_url ||
                  `https://placehold.co/100x100/1e293b/cbd5e1?text=${item.nombre}`
                }
                alt={item.nombre}
                className="item-image"
              />

              <div className="item-details">
                <h3 className="item-name">{item.nombre}</h3>
                <p className="item-price">
                  Precio unitario: S/.{item.precio_unitario.toFixed(2)}
                </p>
              </div>

              <div className="item-quantity-control">
                <button
                  onClick={() =>
                    decrementQuantity(item.id_producto, item.cantidad)
                  }
                  className="quantity-button minus"
                  disabled={item.cantidad <= 1}
                >
                  <FaMinusCircle />
                </button>

                <span className="item-quantity-display">{item.cantidad}</span>

                <button
                  onClick={() =>
                    incrementQuantity(item.id_producto, item.cantidad)
                  }
                  className="quantity-button plus"
                >
                  <FaPlusCircle />
                </button>

                <button
                  onClick={() => removeItem(item.id_producto)}
                  className="item-remove-button"
                  title="Eliminar producto"
                >
                  <FaTrash />
                </button>
              </div>

              <div className="item-actions">
                <p className="item-subtotal">
                  S/.{item.total_producto.toFixed(2)}
                </p>
              </div>
            </div>
          ))}

          <button className="cart-empty-button" onClick={handleGoToCatalog}>
            Continuar Comprando
          </button>
        </div>

        {/* Resumen + Pago */}
        <div className="cart-summary">
          <h2 className="summary-title">Resumen de tu Pedido</h2>

          <div className="summary-details">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>S/.{subtotal.toFixed(2)}</span>
            </div>

            <div className="summary-row summary-total">
              <span className="summary-label">Total a Pagar:</span>
              <span className="summary-value">S/.{totalPagar.toFixed(2)}</span>
            </div>
          </div>

          <button className="checkout-button" onClick={handleCheckout}>
            Proceder al Pago
          </button>

          {/* Modal de pago (Stripe) */}
          {checkoutMarked &&
            stripePromise &&
            optionsCheckout &&
            paymentStatus === "idle" && (
              <Elements stripe={stripePromise} options={optionsCheckout}>
                <PagoModalCheckout
                  apiCheckoutUrl={API_CHECKOUT_URL}
                  onClose={() => setCheckoutMarked(false)}
                  onSuccess={(paymentIntent) => {
                    setLastPaymentIntent(paymentIntent);
                    setCheckoutMarked(false);
                    setPaymentStatus("success");
                    handleSendConfirmationEmail();
                    handleAddPedidoFinalizado();
                  }}
                  onFailure={(message) => {
                    setPaymentError(message);
                    setCheckoutMarked(false);
                    setPaymentStatus("error");
                  }}
                />
              </Elements>
            )}

          {/* Modal de pago exitoso */}
          {paymentStatus === "success" && (
            <PagoConfirmado
              amount={totalPagar}
              onClose={() => {
                setPaymentStatus("idle");
              }}
            />
          )}

          {/* Modal de pago fallido */}
          {paymentStatus === "error" && (
            <PagoFallido
              message={paymentError}
              onRetry={() => {
                setPaymentStatus("idle");
                handleCheckout();
              }}
              onClose={() => setPaymentStatus("idle")}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Carrito;
