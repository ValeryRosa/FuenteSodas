// frontend/src/components/Catalogo.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Catalogo.css";
import ProductCard from "./ProductCard.jsx";

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");

  //Cargar datos del Backend
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/productos");
        setProductos(response.data);
        setProductosFiltrados(response.data);
      } catch (err) {
        console.error("Error al cargar productos:", err);
      }
    };
    fetchProductos();
  }, []);

  //Filtrar productos (Buscador y Categorías)
  useEffect(() => {
    let filtrados = [...productos];

    //Filtrar por categoría
    if (categoriaActiva !== "Todos") {
      filtrados = filtrados.filter(
        (p) => p.categoria_nombre === categoriaActiva
      );
    }

    //Filtrar por búsqueda
    if (busqueda.trim() !== "") {
      filtrados = filtrados.filter((p) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    setProductosFiltrados(filtrados);
  }, [busqueda, categoriaActiva, productos]);

  return (
    <div className="catalogo-container">
      {/*Categorías*/}
      <div className="category-filters">
        <button
          className={`category-btn ${
            categoriaActiva === "Todos" ? "active" : ""
          }`}
          onClick={() => setCategoriaActiva("Todos")}
        >
          <p>Todos</p>
        </button>

        {/*Botón PLATOS */}
        <button
          className={`category-btn ${
            categoriaActiva === "Platos" ? "active" : ""
          }`}
          onClick={() => setCategoriaActiva("Platos")}
        >
          <img
            src={
              categoriaActiva === "Platos"
                ? "/img/iconos/iconoPlatosSelect.jpg"
                : "/img/iconos/iconoPlatos.jpg"
            }
            alt="Platos"
          />
          <p>Platos</p>
        </button>

        {/*Botón POSTRES */}
        <button
          className={`category-btn ${
            categoriaActiva === "Postres" ? "active" : ""
          }`}
          onClick={() => setCategoriaActiva("Postres")}
        >
          <img
            src={
              categoriaActiva === "Postres"
                ? "/img/iconos/iconoPostresSelect.jpg"
                : "/img/iconos/iconoPostres.jpg"
            }
            alt="Postres"
          />
          <p>Postres</p>
        </button>

        {/*Botón BEBIDAS */}
        <button
          className={`category-btn ${
            categoriaActiva === "Bebidas" ? "active" : ""
          }`}
          onClick={() => setCategoriaActiva("Bebidas")}
        >
          <img
            src={
              categoriaActiva === "Bebidas"
                ? "/img/iconos/iconoBebidasSelect.jpg"
                : "/img/iconos/iconoBebidas.jpg"
            }
            alt="Bebidas"
          />
          <p>Bebidas</p>
        </button>
      </div>

      <div className="catalogo-header">
        <h1>LA CARTA</h1>
      </div>

      {/*Buscador*/}
      <div className="product-list-header">
        <h2>¿Qué deseas comer hoy ...?</h2>
        <input
          type="text"
          placeholder="Busca tu plato favorito..."
          className="search-bar"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/*Lista de Productos*/}
      <div className="product-grid">
        {productosFiltrados.map((producto) => (
          <ProductCard key={producto.id_producto} producto={producto} />
        ))}
      </div>
    </div>
  );
}

export default Catalogo;
