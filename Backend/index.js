const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- Configuración de la Conexión a MySQL ---
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'bd_fuente'
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conectado exitosamente a la base de datos MySQL.');
});

// --- Rutas (Endpoints) ---


// Ruta para el registro de usuarios (TA05)
app.post('/api/usuarios/registro', async (req, res) => { 
  console.log("Datos recibidos:", req.body);
  const { 
    nombre, email, password, fecha_nacimiento, 
    celular, tipo_documento, numero_documento, genero 
  } = req.body;
    
  const rol = 'cliente';
  
  //Validación de Celular (9 dígitos numéricos)
  const celularRegex = /^\d{9}$/;
  if (!celularRegex.test(celular)) {
    return res.status(400).json({ message: 'Error: El celular debe tener exactamente 9 dígitos numéricos.' });
  }

  //Validación de Documento (DNI 8 dígitos, Pasaporte 12 caracteres)
  if (tipo_documento === 'dni') {
    const dniRegex = /^\d{8}$/;
    if (!dniRegex.test(numero_documento)) {
      return res.status(400).json({ message: 'Error: El DNI debe tener exactamente 8 dígitos numéricos.' });
    }
  } else if (tipo_documento === 'pasaporte') {
    if (numero_documento.length !== 12) {
      return res.status(400).json({ message: 'Error: El pasaporte debe tener exactamente 12 caracteres.' });
    }
  }

  //Validación de Fecha de Nacimiento (no futura)
  const inputDate = new Date(fecha_nacimiento);
  const today = new Date();
  
  if (inputDate > today) {
    return res.status(400).json({ message: 'Error: La fecha de nacimiento no puede ser en el futuro.' });
  }  

  //Validación de Contraseña (mínimo 6 caracteres)
  if (password.length < 6) {
    return res.status(400).json({ message: 'Error: La contraseña debe tener al menos 6 caracteres.' });
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
    
  //Query SQL
  const sql = `
    INSERT INTO Usuarios 
    (nombre, email, password, rol, fecha_nacimiento, celular, tipo_documento, numero_documento, genero) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    nombre, 
    email, 
    hashedPassword, 
    rol, 
    fecha_nacimiento, 
    celular, 
    tipo_documento, 
    numero_documento, 
    genero
  ], (err, result) => {
    if (err) {
      console.error('Error al registrar usuario:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Error: El correo electrónico ya está registrado.' });
      }
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
        
    console.log('Usuario registrado con éxito:', result);
    res.status(201).json({ message: '¡Usuario registrado con éxito!' });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});