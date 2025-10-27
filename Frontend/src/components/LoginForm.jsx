import React, { useState } from 'react';
import './LoginForm.css';
import axios from 'axios';

function LoginForm({ loginType, onLoginSuccess }) {
    
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rol: loginType === 'cliente' ? 'cliente' : 'operador' 
  });

  const [error, setError] = useState('');

  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      email: '',
      password: '',
      rol: loginType === 'cliente' ? 'cliente' : 'operador'
    }));
  }, [loginType]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Limpiamos errores antiguos

        try {
            // 4. Llamamos a la nueva ruta del backend
            const response = await axios.post('http://localhost:3001/api/usuarios/login', formData);

            // 5. ¡ÉXITO! Llamamos a la función del App.jsx
            // response.data.usuario contiene { id, nombre, rol }
            if (onLoginSuccess) {
                onLoginSuccess(response.data.usuario);
            }

        } catch (err) {
            // 6. Si el backend da error (401, 500)
            console.error('Error en el login:', err.response?.data?.message);
            setError(err.response?.data?.message || 'Error al iniciar sesión.');
        }
    };

  return (
    <div className="login-form-container">
      <h2>{loginType === 'cliente' ? 'Iniciar Sesión' : 'Acceso Personal'}</h2>

      <form onSubmit={handleSubmit} className="login-form">
                
        <div className="form-group">
          <label>Correo Electrónico:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Contraseña:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>

        {loginType === 'personal' && (
          <div className="form-group">
            <label>Seleccionar Rol:</label>
            <select
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              required
              >
              <option value="operador">Soy Operador</option>
              <option value="administrador">Soy Administrador</option>
            </select>
          </div>
        )}

        <button type="submit" className="submit-button">Ingresar</button>
      </form>
    </div>
  );
}

export default LoginForm;