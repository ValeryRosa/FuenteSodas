import React from "react";
import axios from 'axios';
import "./ProductCard.css";
import { useUserStore } from "../store/useUserStore";

const API_AGREGAR_URL = 'http://localhost:3001/api/carrito/agregar';

function ProductCard({ producto }) {

  const currentUser = useUserStore.getState().userInfo;
  console.log("ProductCard - currentUser:", currentUser);

  // Formateador para el precio (ej. 40.00 -> S/ 40.00)
  const formatPrice = (price) => {
    return `S/ ${parseFloat(price).toFixed(2)}`;
  };

  const handleAddToCart = async () => {
    console.log(`Añadiendo ${producto.nombre} (ID: ${producto.id_producto}) al carro.`);
    
    try {
        // --- ENVÍO DE DATOS AL BACKEND ---
        await axios.post(API_AGREGAR_URL, {
            id_producto: producto.id_producto, // Enviamos el ID del producto
            cantidad: 1,              // Enviamos la cantidad
            id_usuario: currentUser.id // Enviamos el ID del cliente
        });
        // ----------------------------------

        // Muestra la alerta de confirmación sin navegar
        alert(`Añadido: ${producto.nombre}`);
        
        // NOTA: Si tienes un ícono de carrito en el header, 
        // necesitarías un Context de React aquí para actualizarlo.

    } catch (error) {
        console.error("Error al añadir producto:", error.response?.data?.message || error.message);
        alert(`Error al añadir ${producto.nombre}: ${error.response?.data?.message || 'Error de conexión.'}`);
    }
  };

  return (
    <div className="product-card">
      {/* Información del producto (izquierda) */}
      <div className="product-info">
        <h3>{producto.nombre}</h3>
        <p>{producto.descripcion}</p>
        <div className="product-price">{formatPrice(producto.precio)}</div>
        <button onClick={handleAddToCart} className="add-to-cart-btn">
          Agregar al carro
        </button>
      </div>

      {/* Imagen del producto (derecha) */}
      <img
        src={producto.imagen_url}
        alt={producto.nombre}
        className="product-image"
      />
    </div>
  );
}

export default ProductCard;
