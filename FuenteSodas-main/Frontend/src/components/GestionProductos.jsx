import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminGestion.css";
import { FaPencilAlt, FaTrash, FaPlus } from "react-icons/fa";
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
    console.log("Clic en Nuevo Producto");
    setProductoEditando(null);
    setIsModalOpen(true);
  };

  //Actualizar
  const handleEditarProducto = (producto) => {
    console.log("Clic en Editar Producto:", producto);
    setProductoEditando(producto);
    setIsModalOpen(true);
  };

  const handleCerrarModal = (productoGuardado) => {
    setIsModalOpen(false);
    setProductoEditando(null);

    if (productoGuardado) {
      setProductos((prevProductos) => {
        const existingIndex = prevProductos.findIndex(
          (p) => p.id_producto === productoGuardado.id_producto
        );
        if (existingIndex !== -1) {
          const newProducts = [...prevProductos];
          newProducts[existingIndex] = productoGuardado;
          return newProducts;
        } else {
          return [productoGuardado, ...prevProductos];
        }
      });
    }
  };

  //Eliminar
  const handleBorrarProducto = (idProducto) => {
    if (
      window.confirm(
        "¿Estás seguro de que quieres borrar este producto? ¡Esta acción es irreversible!"
      )
    ) {
      axios
        .delete(`http://localhost:3001/api/admin/productos/${idProducto}`)
        .then((response) => {
          setProductos((prev) =>
            prev.filter((p) => p.id_producto !== idProducto)
          );
          alert("Producto eliminado exitosamente.");
        })
        .catch((err) => {
          console.error("Error al borrar producto:", err);
          alert(
            `Error al borrar: ${
              err.response?.data?.message || "Error del servidor"
            }`
          );
        });
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
        <button className="btn-nueva" onClick={handleNuevoProducto}>
          <FaPlus /> Nuevo
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
              <td>
                {/* Botón de Edición*/}
                <button
                  className="btn-accion editar"
                  onClick={() => handleEditarProducto(producto)}
                  title="Editar"
                >
                  <FaPencilAlt />
                </button>
                {/* Botón de Eliminación*/}
                <button
                  className="btn-accion eliminar"
                  onClick={() => handleBorrarProducto(producto.id_producto)}
                  title="Eliminar"
                >
                  <FaTrash />
                </button>
              </td>
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

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          // --------------------------
          onClose={() => setIsModalOpen(false)}
          title={productoEditando ? "Editar Producto" : "Registrar Producto"}
        >
          {" "}
          <ProductoForm
            onProductoGuardado={handleCerrarModal}
            productoParaEditar={productoEditando}
          />{" "}
        </Modal>
      )}
    </div>
  );
}

export default GestionProductos;
