import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminGestion.css";
import { FaPencilAlt, FaTrash } from "react-icons/fa";
import Modal from "./Modal.jsx";
import ProductoForm from "./ProductoForm.jsx";

function GestionProductos({ currentUser }) {
  const [productos, setProductos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);

  // Cargar productos del backend
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3001/api/admin/productos"
        );
        setProductos(response.data);
      } catch (err) {
        console.error("Error al cargar productos:", err);
      }
    };
    fetchProductos();
  }, []);

  //CRUD

  //Crear
  const handleNuevoProducto = () => {
    setProductoEditando(null);
    setIsModalOpen(true);
  };

  //Actualizar
  const handleEditarProducto = (producto) => {
    setProductoEditando(producto);
    setIsModalOpen(true);
  };

  //Eliminar
  const handleBorrarProducto = (idProducto) => {
    if (window.confirm("¿Seguro que quieres borrar este producto?")) {
      console.log("Borrando producto ID:", idProducto);
      alert("Funcionalidad de borrar pendiente.");
    }
  };

  const handleProductoGuardado = (productoGuardado) => {
    if (productoEditando) {
      setProductos((prev) =>
        prev.map((p) =>
          p.id_producto === productoGuardado.id_producto ? productoGuardado : p
        )
      );
    } else {
      setProductos((prev) => [...prev, productoGuardado]);
    }
    setIsModalOpen(false);
  };

  const formatPrice = (price) => `S/ ${parseFloat(price).toFixed(2)}`;

  return (
    <div className="gestion-container">
      {/* Encabezado*/}
      <div className="gestion-header">
        <h2>Gestión de Productos</h2>
        <button onClick={handleNuevoProducto} className="btn-nueva">
          + Nuevo Producto
        </button>
      </div>

      {/* Tabla de Productos*/}
      <table className="gestion-tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Descripción</th>
            <th>Imagen</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => (
            <tr key={producto.id_producto}>
              <td>{producto.nombre}</td>
              <td>{producto.nombre_categoria}</td>
              <td>{formatPrice(producto.precio)}</td>
              <td>{producto.stock}</td>
              <td>{producto.descripcion}</td>
              <td>
                {producto.imagen_url ? (
                  <img
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    style={{
                      width: "50px",
                      height: "50px",
                      objectFit: "cover",
                      borderRadius: "4px",
                    }}
                  />
                ) : (
                  "N/A"
                )}
              </td>
              {/* --------------------------- */}
              <td>{/* ... (botones de editar/eliminar) ... */}</td>
            </tr>
          ))}
          {productos.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                No hay productos registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/*Modal con el Formulario*/}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProductoEditando(null);
        }}
        title={productoEditando ? "Editar Producto" : "Nuevo Producto"}
      >
        <ProductoForm
          adminId={currentUser?.id}
          productoParaEditar={productoEditando}
          onProductoGuardado={handleProductoGuardado}
        />
      </Modal>
    </div>
  );
}

export default GestionProductos;
