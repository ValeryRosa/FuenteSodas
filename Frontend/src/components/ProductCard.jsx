import React from "react";
import "./ProductCard.css";

// Recibe un 'producto' como prop
function ProductCard({ producto }) {
  // Formateador para el precio (ej. 40.00 -> S/ 40.00)
  const formatPrice = (price) => {
    return `s/ ${parseFloat(price).toFixed(2)}`;
  };

  const handleAddToCart = () => {
    console.log(`Añadiendo ${producto.nombre} al carro.`);
    alert(`Añadido: ${producto.nombre}`);
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
