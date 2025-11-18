// frontend/src/components/CategoriaForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./LoginForm.css";

//Props: 'categoriaParaEditar' y 'onCategoriaActualizada'
function CategoriaForm({
  adminId,
  onCategoriaCreada,
  categoriaParaEditar,
  onCategoriaActualizada,
}) {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  //Rellena el formulario si se proporciona 'categoriaParaEditar'
  useEffect(() => {
    if (categoriaParaEditar) {
      setNombre(categoriaParaEditar.nombre);
      setIsEditing(true);
    } else {
      setNombre("");
      setIsEditing(false);
    }
  }, [categoriaParaEditar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const datos = {
        nombre: nombre,
        id_usuario_actualizacion: adminId,
      };

      if (isEditing) {
        //Llamada al endpoint PUT
        const response = await axios.put(
          `http://localhost:3001/api/admin/categorias/${categoriaParaEditar.id_categoria}`,
          datos
        );
        //Notificar al componente padre con la categoría ACTUALIZADA
        onCategoriaActualizada(response.data);
      } else {
        datos.id_usuario_registro = adminId;
        const response = await axios.post(
          "http://localhost:3001/api/admin/categorias",
          datos
        );
        onCategoriaCreada(response.data);
      }
      if (!isEditing) setNombre("");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          (isEditing ? "Error al actualizar" : "Error al crear")
      );
    }
  };

  return (
    // Añadimos 'noValidate' para prevenir la validación del navegador
    <form onSubmit={handleSubmit} className="login-form" noValidate>
      <div className="form-group">
        <label>Nombre de la Categoría:</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Bebidas"
          required
        />
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button type="submit" className="submit-button">
        {/* 6. Cambiamos el texto del botón */}
        {isEditing ? "Actualizar" : "Registrar"}
      </button>
    </form>
  );
}
export default CategoriaForm;
