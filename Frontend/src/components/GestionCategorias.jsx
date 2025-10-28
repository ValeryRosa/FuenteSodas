import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminGestion.css";
import { FaPencilAlt, FaTrash } from "react-icons/fa";
import Modal from "./Modal.jsx";
import CategoriaForm from "./CategoriaForm.jsx";

function GestionCategorias({ currentUser }) {
  console.log("currentUser dentro de GestionCategorias:", currentUser);

  const [categorias, setCategorias] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3001/api/admin/categorias"
        );
        setCategorias(response.data);
      } catch (err) {
        console.error("Error al cargar categorías:", err);
      }
    };
    fetchCategorias();
  }, []);

  //CRUD
  //Crear
  const handleNuevaCategoria = () => {
    setCategoriaEditando(null);
    setIsModalOpen(true);
  };
  const handleCategoriaCreada = (nuevaCategoria) => {
    setCategorias((prev) => [...prev, nuevaCategoria]);
    setIsModalOpen(false);
  };

  //Actualizar
  const handleEditarCategoria = (categoria) => {
    setCategoriaEditando(categoria);
    setIsModalOpen(true);
  };

  const handleCategoriaActualizada = (categoriaActualizada) => {
    setCategorias((prev) =>
      prev.map((cat) =>
        cat.id_categoria === categoriaActualizada.id_categoria
          ? categoriaActualizada
          : cat
      )
    );
    setIsModalOpen(false);
  };

  //Eliminar
  const handleBorrarCategoria = async (idCategoria) => {
    if (window.confirm("¿Estás seguro de que quieres borrar esta categoría?")) {
      try {
        await axios.delete(
          `http://localhost:3001/api/admin/categorias/${idCategoria}`
        );
        setCategorias((prev) =>
          prev.filter((cat) => cat.id_categoria !== idCategoria)
        );
        alert("Categoría borrada exitosamente.");
      } catch (err) {
        console.error("Error al borrar categoría:", err);
        alert(
          `Error al borrar: ${
            err.response?.data?.message || "Error del servidor"
          }`
        );
      }
    }
  };

  const formatFecha = (isoDate) => {
    if (!isoDate) return "N/A";
    try {
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) return "Fecha inválida";
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return "Error fecha";
    }
  };

  return (
    <div className="gestion-container">
      <div className="gestion-header">
        <h2>Gestión de Categorías</h2>
        <button onClick={handleNuevaCategoria} className="btn-nueva">
          + Nueva
        </button>
      </div>

      <table className="gestion-tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Fecha de Registro</th>
            <th>Registrado por</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((categoria) => (
            <tr key={categoria.id_categoria}>
              <td>{categoria.nombre}</td>
              <td>{formatFecha(categoria.fecha_registro)}</td>
              <td>{categoria.nombre_usuario || "Sistema"}</td>
              <td>
                <button
                  className="btn-accion editar"
                  onClick={() => handleEditarCategoria(categoria)}
                >
                  <FaPencilAlt />
                </button>
                <button
                  className="btn-accion eliminar"
                  onClick={() => handleBorrarCategoria(categoria.id_categoria)}
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
          {categorias.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No hay categorías registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Modal
        isOpen={isModalOpen}
        // Limpia el estado de edición al cerrar
        onClose={() => {
          setIsModalOpen(false);
          setCategoriaEditando(null);
        }}
        title={categoriaEditando ? "Editar Categoría" : "Crear Nueva Categoría"}
      >
        {currentUser ? (
          <CategoriaForm
            adminId={currentUser.id}
            onCategoriaCreada={handleCategoriaCreada}
            categoriaParaEditar={categoriaEditando}
            onCategoriaActualizada={handleCategoriaActualizada}
          />
        ) : (
          <p>Error: No se pudo obtener la información del administrador.</p>
        )}
      </Modal>
    </div>
  );
}

export default GestionCategorias;
