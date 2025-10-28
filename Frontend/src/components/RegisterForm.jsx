import React, { useState } from "react";
import "./RegisterForm.css";
import axios from "axios";

function RegisterForm({ onSuccessfulRegister }) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    fecha_nacimiento: "",
    celular: "",
    tipo_documento: "dni",
    numero_documento: "",
    genero: "",
  });

  const [errors, setErrors] = useState({});
  const today = new Date().toISOString().split("T")[0];

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "celular":
        const celularRegex = /^\d{9}$/;
        if (!celularRegex.test(value)) {
          error = "Debe tener 9 dígitos numéricos.";
        }
        break;

      case "numero_documento":
        const tipo = formData.tipo_documento;
        if (tipo === "dni") {
          const dniRegex = /^\d{8}$/;
          if (!dniRegex.test(value)) {
            error = "DNI debe tener 8 dígitos numéricos.";
          }
        } else if (tipo === "pasaporte") {
          if (value.length !== 12) {
            error = "Pasaporte debe tener 12 caracteres.";
          }
        }
        break;

      case "tipo_documento":
        // Si cambia el tipo, re-valida el número
        setErrors((prevErrors) => ({
          ...prevErrors,
          numero_documento: "",
        }));
        break;

      case "password":
        if (value.length < 6) {
          error = "Debe tener al menos 6 caracteres.";
        }
        break;

      case "fecha_nacimiento":
        const inputDate = new Date(value);
        if (inputDate > new Date()) {
          error = "La fecha no puede ser futura.";
        }
        break;

      default:
        break;
    }

    // Actualiza estado de errores
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    //Actualizar valor del formulario
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    Object.keys(formData).forEach((name) =>
      validateField(name, formData[name])
    );

    if (Object.values(errors).some((error) => error !== "")) {
      alert("Por favor, corrige los errores en el formulario.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3001/api/usuarios/registro",
        formData
      );
      alert("¡Registro exitoso!");

      if (onSuccessfulRegister) {
        onSuccessfulRegister();
      }
    } catch (err) {
      console.error("Error en el registro:", err.response.data.message);
      setErrors((prev) => ({ ...prev, backend: err.response.data.message }));
    }
  };

  return (
    <div className="register-form-container">
      <h2>Registrarme</h2>
      <p>Completa la siguiente información</p>

      <form onSubmit={handleSubmit} className="register-form" noValidate>
        <div className="form-group full-width">
          <input
            type="text"
            name="nombre"
            placeholder="Nombres"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group full-width">
          <input
            type="email"
            name="email"
            placeholder="Correo Electrónico"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <select
            name="tipo_documento"
            value={formData.tipo_documento}
            onChange={handleChange}
            required
          >
            <option value="dni">DNI</option>
            <option value="pasaporte">Pasaporte</option>
          </select>
        </div>
        <div className="form-group">
          <input
            type="text"
            name="numero_documento"
            placeholder="Documento"
            value={formData.numero_documento}
            onChange={handleChange}
            required
          />
          {errors.numero_documento && (
            <span className="error-message">{errors.numero_documento}</span>
          )}
        </div>

        <div className="form-group">
          <input
            type="date"
            name="fecha_nacimiento"
            placeholder="Fecha nacimiento"
            value={formData.fecha_nacimiento}
            onChange={handleChange}
            required
            max={today}
          />
          {errors.fecha_nacimiento && (
            <span className="error-message">{errors.fecha_nacimiento}</span>
          )}
        </div>
        <div className="form-group">
          <select
            name="genero"
            value={formData.genero}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Selecciona género
            </option>
            <option value="femenino">Femenino</option>
            <option value="masculino">Masculino</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div className="form-group">
          <input
            type="tel"
            name="celular"
            placeholder="Celular"
            value={formData.celular}
            onChange={handleChange}
            required
          />
          {errors.celular && (
            <span className="error-message">{errors.celular}</span>
          )}
        </div>
        <div className="form-group">
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {errors.password && (
            <span className="error-message">{errors.password}</span>
          )}
        </div>

        <button type="submit" className="submit-button">
          Crear cuenta
        </button>
        {errors.backend && (
          <div
            className="form-group full-width"
            style={{ textAlign: "center" }}
          >
            <span className="error-message">{errors.backend}</span>
          </div>
        )}
      </form>
    </div>
  );
}

export default RegisterForm;
