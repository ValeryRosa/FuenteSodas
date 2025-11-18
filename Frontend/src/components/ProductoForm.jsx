import React, { useState, useEffect } from "react";
import axios from "axios";
import "./LoginForm.css";

function ProductoForm({ adminId, onProductoGuardado, productoParaEditar }) {
  const initialState = {
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
    id_categoria: "",
    imagen: null,
  };

  const [formData, setFormData] = useState(initialState);
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [previewImagen, setPreviewImagen] = useState(null);

  // Cargar Categorías Dinámicamente
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3001/api/admin/categorias"
        );
        setCategorias(response.data);
        if (!productoParaEditar && response.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            id_categoria: response.data[0].id_categoria,
          }));
        }
      } catch (err) {
        console.error("Error cargando categorías para el formulario:", err);
        setError("No se pudieron cargar las categorías.");
      }
    };
    cargarCategorias();
  }, [productoParaEditar]);

  // Rellenar formulario si se edita
  useEffect(() => {
    if (productoParaEditar) {
      setFormData({
        nombre: productoParaEditar.nombre || "",
        descripcion: productoParaEditar.descripcion || "",
        precio: productoParaEditar.precio || "",
        stock: productoParaEditar.stock || "",
        id_categoria: productoParaEditar.id_categoria || "",
        imagen: null,
      });
      setIsEditing(true);
      if (productoParaEditar.imagen_url) {
        setPreviewImagen(productoParaEditar.imagen_url);
      } else {
        setPreviewImagen(null);
      }
    } else {
      setFormData(initialState);
      setIsEditing(false);
      setPreviewImagen(null);
    }
  }, [productoParaEditar]);

  // Manejar cambios en inputs de texto/número
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar cambio en input de archivo (imagen)
  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, imagen: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImagen(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, imagen: null }));
      setPreviewImagen(productoParaEditar?.imagen_url || null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validación simple
    if (
      !formData.nombre ||
      !formData.precio ||
      !formData.stock ||
      !formData.id_categoria
    ) {
      setError("Por favor, complete todos los campos obligatorios.");
      return;
    }

    // Crear el objeto FormData
    const data = new FormData();
    data.append("nombre", formData.nombre);
    data.append("descripcion", formData.descripcion);
    data.append("precio", formData.precio);
    data.append("stock", formData.stock);
    data.append("id_categoria", formData.id_categoria);

    if (formData.imagen) {
      data.append("imagen", formData.imagen);
    }

    if (isEditing && !formData.imagen) {
      data.append("imagen_url_existente", productoParaEditar.imagen_url);
    }

    const url = isEditing
      ? `http://localhost:3001/api/admin/productos/${productoParaEditar.id_producto}`
      : "http://localhost:3001/api/admin/productos";
    const method = isEditing ? "put" : "post";

    axios({
      method: method,
      url: url,
      data: data,
    })
      .then((response) => {
        onProductoGuardado(response.data);
        alert(
          `Producto ${isEditing ? "actualizado" : "registrado"} con éxito!`
        );
      })
      .catch((err) => {
        console.error(
          "Error al guardar producto:",
          err.response?.data?.message
        );
        setError(
          err.response?.data?.message || "Error al guardar el producto."
        );
      });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="login-form"
      encType="multipart/form-data"
    >
      <div className="form-group">
        <label>Nombre del Producto:</label>
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Descripción:</label>
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          rows="3"
        ></textarea>
      </div>

      <div className="form-group">
        <label>Precio (S/):</label>
        <input
          type="number"
          name="precio"
          value={formData.precio}
          onChange={handleChange}
          step="0.01"
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label>Stock:</label>
        <input
          type="number"
          name="stock"
          value={formData.stock}
          onChange={handleChange}
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label>Categoría:</label>
        <select
          name="id_categoria"
          value={formData.id_categoria}
          onChange={handleChange}
          required
        >
          <option value="" disabled>
            Selecciona una categoría
          </option>
          {categorias.map((cat) => (
            <option key={cat.id_categoria} value={cat.id_categoria}>
              {cat.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Imagen del Producto:</label>
        <input
          type="file"
          name="imagen"
          accept="image/jpeg, image/png"
          onChange={handleImagenChange}
        />
        {previewImagen && (
          <img
            src={previewImagen}
            alt="Previsualización"
            style={{ maxWidth: "100px", marginTop: "10px" }}
          />
        )}
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button type="submit" className="submit-button">
        {isEditing ? "Actualizar Producto" : "Registrar Producto"}
      </button>
    </form>
  );
}

export default ProductoForm;
