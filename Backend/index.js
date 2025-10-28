const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- Configuración de la Conexión a MySQL ---
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "admin",
  database: "bd_fuente",
});

db.connect((err) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err);
    return;
  }
  console.log("Conectado exitosamente a la base de datos MySQL.");
});

// Variable global para almacenar el mapeo ID -> Nombre
let categoriaMap = {};

// Función para cargar los nombres de las categorías y guardarlos en el mapa
const cargarNombresCategorias = () => {
  const sql = "SELECT id_categoria, nombre FROM Categorias";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al cargar mapeo de categorías:", err);
      return;
    }
    // Crea el mapa: { '1': 'Platos', '2': 'Postres', ... }
    categoriaMap = results.reduce((map, cat) => {
      map[cat.id_categoria] = cat.nombre.toLowerCase().replace(/ /g, "-");
      return map;
    }, {});
    console.log("Mapeo de categorías cargado:", categoriaMap);
  });
};

// Llama a la función al iniciar la aplicación
db.connect((err) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err);
    return;
  }
  console.log("Conectado exitosamente a la base de datos MySQL.");
  cargarNombresCategorias(); // <-- ¡Cargamos los nombres aquí!
});

const uploadDirBase = path.join(__dirname, "..", "Frontend", "public", "img");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const idCategoria = req.body.id_categoria; // Obtenemos el ID del formulario

    // 1. Usamos el mapa para encontrar el nombre de la carpeta
    const nombreCarpeta = categoriaMap[idCategoria];

    if (!nombreCarpeta) {
      // Si el nombre no existe (o el mapa está vacío), lo enviamos a una carpeta 'otros'
      return cb(
        new Error("Categoría de destino no encontrada en el mapa."),
        false
      );
    }

    // 2. Construimos la ruta final: /public/img/platos/
    const destinoFinal = path.join(uploadDirBase, nombreCarpeta);

    // 3. Verificamos que el directorio exista (Multer no lo hace recursivamente)
    // Aunque no estamos usando async/await, usamos la versión síncrona de mkdir para la seguridad de Multer
    if (!fs.existsSync(destinoFinal)) {
      fs.mkdirSync(destinoFinal, { recursive: true });
    }

    cb(null, destinoFinal);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "-" + file.originalname.toLowerCase().replace(/ /g, "-")
    );
  },
});

const upload = multer({ storage: storage });

// --- Rutas (Endpoints) ---

// Ruta para el registro de usuarios
app.post("/api/usuarios/registro", (req, res) => {
  console.log("Datos recibidos:", req.body);
  const {
    nombre,
    email,
    password,
    fecha_nacimiento,
    celular,
    tipo_documento,
    numero_documento,
    genero,
  } = req.body;

  const rol = "cliente";

  //Validación de Celular (9 dígitos numéricos)
  const celularRegex = /^\d{9}$/;
  if (!celularRegex.test(celular)) {
    return res.status(400).json({
      message: "Error: El celular debe tener exactamente 9 dígitos numéricos.",
    });
  }

  //Validación de Documento (DNI 8 dígitos, Pasaporte 12 caracteres)
  if (tipo_documento === "dni") {
    const dniRegex = /^\d{8}$/;
    if (!dniRegex.test(numero_documento)) {
      return res.status(400).json({
        message: "Error: El DNI debe tener exactamente 8 dígitos numéricos.",
      });
    }
  } else if (tipo_documento === "pasaporte") {
    if (numero_documento.length !== 12) {
      return res.status(400).json({
        message: "Error: El pasaporte debe tener exactamente 12 caracteres.",
      });
    }
  }

  //Validación de Fecha de Nacimiento (no futura)
  const inputDate = new Date(fecha_nacimiento);
  const today = new Date();

  if (inputDate > today) {
    return res.status(400).json({
      message: "Error: La fecha de nacimiento no puede ser en el futuro.",
    });
  }

  //Validación de Contraseña (mínimo 6 caracteres)
  if (password.length < 6) {
    return res.status(400).json({
      message: "Error: La contraseña debe tener al menos 6 caracteres.",
    });
  }

  const saltRounds = 10;

  //Query SQL
  const sql = `
    INSERT INTO Usuarios 
    (nombre, email, password, rol, fecha_nacimiento, celular, tipo_documento, numero_documento, genero) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      nombre,
      email,
      password,
      rol,
      fecha_nacimiento,
      celular,
      tipo_documento,
      numero_documento,
      genero,
    ],
    (err, result) => {
      if (err) {
        console.error("Error al registrar usuario:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({
            message: "Error: El correo electrónico ya está registrado.",
          });
        }
        return res.status(500).json({ message: "Error interno del servidor." });
      }

      console.log("Usuario registrado con éxito:", result);
      res.status(201).json({ message: "¡Usuario registrado con éxito!" });
    }
  );
});

// Ruta para crear personal por admin
app.post("/api/admin/crear-personal", (req, res) => {
  console.log("Datos recibidos para crear personal:", req.body);

  const {
    nombre,
    email,
    password,
    tipo_documento,
    numero_documento,
    celular,
    rol,
    fecha_nacimiento,
  } = req.body;

  // Validación de Rol: Solo crear personal, no clientes.
  if (rol !== "administrador" && rol !== "operador") {
    return res
      .status(400)
      .json({ message: "Error: Rol de personal no válido." });
  }

  // Validación de Celular (9 dígitos)
  const celularRegex = /^\d{9}$/;
  if (!celularRegex.test(celular)) {
    return res.status(400).json({
      message: "Error: El celular debe tener exactamente 9 dígitos numéricos.",
    });
  }

  // Validación de Documento (DNI 8, Pasaporte 12)
  if (tipo_documento === "dni") {
    const dniRegex = /^\d{8}$/;
    if (!dniRegex.test(numero_documento)) {
      return res.status(400).json({
        message: "Error: El DNI debe tener exactamente 8 dígitos numéricos.",
      });
    }
  } else if (tipo_documento === "pasaporte") {
    if (numero_documento.length !== 12) {
      return res.status(400).json({
        message: "Error: El pasaporte debe tener exactamente 12 caracteres.",
      });
    }
  }

  // Validación de Contraseña (mínimo 6 caracteres)
  if (password.length < 6) {
    return res.status(400).json({
      message: "Error: La contraseña debe tener al menos 6 caracteres.",
    });
  }

  // Encriptamos la contraseña
  const saltRounds = 10;

  //Validación de Fecha de Nacimiento (no futura)
  const inputDate = new Date(fecha_nacimiento);
  const today = new Date();
  if (inputDate > today) {
    return res.status(400).json({
      message: "Error: La fecha de nacimiento no puede ser en el futuro.",
    });
  }

  //Query SQL
  const sql = `
    INSERT INTO Usuarios 
    (nombre, email, password, rol, celular, tipo_documento, numero_documento, fecha_nacimiento) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
    `;

  db.query(
    sql,
    [
      nombre,
      email,
      password,
      rol,
      celular,
      tipo_documento,
      numero_documento,
      fecha_nacimiento,
    ],
    (err, result) => {
      if (err) {
        console.error("Error al registrar personal:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({
            message: "Error: El correo electrónico ya está registrado.",
          });
        }
        return res.status(500).json({ message: "Error interno del servidor." });
      }

      console.log("Personal registrado con éxito:", result);
      res.status(201).json({ message: `¡${rol} registrado con éxito!` });
    }
  );
});

//Ruta para login de usuario
app.post("/api/usuarios/login", (req, res) => {
  console.log("Intento de login:", req.body);
  const { email, password, rol } = req.body;

  //Buscar al usuario por email
  const sqlFindUser = "SELECT * FROM Usuarios WHERE email = ?";

  db.query(sqlFindUser, [email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error del servidor." });
    }

    //Verificar si el usuario existe
    if (results.length === 0) {
      return res.status(401).json({ message: "Credenciales incorrectas." });
    }

    const user = results[0]; // El usuario encontrado en la BD

    //Verificar que el rol coincida
    if (user.rol !== rol) {
      return res
        .status(401)
        .json({ message: "Rol incorrecto para este usuario." });
    }

    //Verificar la contraseña
    if (password !== user.password) {
      return res.status(401).json({ message: "Credenciales incorrectas." });
    }

    //El usuario es válido
    console.log("Login exitoso:", user.nombre);

    //Creamos un objeto de usuario para enviar al frontend
    const usuarioParaFrontend = {
      id: user.id_usuario,
      nombre: user.nombre,
      rol: user.rol,
    };

    res.status(200).json({
      message: "Login exitoso",
      usuario: usuarioParaFrontend,
    });
  });
});

//Ruta para obtener los productos y categorias
app.get("/api/productos", (req, res) => {
  const sql = `
        SELECT 
            p.id_producto,
            p.nombre,
            p.descripcion,
            p.precio,
            p.imagen_url,
            c.nombre AS categoria_nombre
        FROM Productos p
        JOIN Categorias c ON p.id_categoria = c.id_categoria
        WHERE p.stock > 0
    `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al consultar productos:", err);
      return res.status(500).json({ message: "Error interno del servidor." });
    }

    res.status(200).json(results);
  });
});

//Ruta para obtener categorías (Admin)
app.get("/api/admin/categorias", (req, res) => {
  // --- ¡RESTAURAR ESTA CONSULTA! ---
  const sql = `
        SELECT
            c.id_categoria,
            c.nombre,
            c.fecha_registro,
            u.nombre AS nombre_usuario
        FROM Categorias c
        LEFT JOIN Usuarios u ON c.id_usuario_registro = u.id_usuario
        ORDER BY c.id_categoria;
    `;
  // ---------------------------------

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al consultar categorías:", err);
      return res.status(500).json({ message: "Error interno del servidor." });
    }
    // Puedes dejar o quitar este log si quieres
    console.log("Resultado de la consulta SQL de categorías:", results);
    res.status(200).json(results);
  });
});

// Ruta para crear nueva categoría (Admin)
app.post("/api/admin/categorias", (req, res) => {
  // Recibimos el nombre (del formulario) y el ID (que pasamos desde React)
  const { nombre, id_usuario_registro } = req.body;

  // Validación simple
  if (!nombre) {
    return res.status(400).json({ message: "El nombre es obligatorio." });
  }

  const sql = `
        INSERT INTO Categorias (nombre, id_usuario_registro) 
        VALUES (?, ?)
    `;

  db.query(sql, [nombre, id_usuario_registro], (err, result) => {
    if (err) {
      console.error("Error al crear categoría:", err);
      return res.status(500).json({ message: "Error interno del servidor." });
    }

    // ¡Éxito! Ahora devolvemos la categoría recién creada
    // para que React pueda actualizar la tabla.
    const nuevaCategoriaId = result.insertId;
    const sqlSelect = `
            SELECT 
                c.id_categoria, c.nombre, c.fecha_registro,
                u.nombre AS nombre_usuario 
            FROM Categorias c
            LEFT JOIN Usuarios u ON c.id_usuario_registro = u.id_usuario
            WHERE c.id_categoria = ?
        `;

    db.query(sqlSelect, [nuevaCategoriaId], (err, rows) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Categoría creada, pero error al recuperarla." });
      }
      // Devolvemos la fila completa, tal como la necesita la tabla
      res.status(201).json(rows[0]);
    });
  });
});

// Ruta para eliminar una  categoría (Admin)
app.delete("/api/admin/categorias/:id", (req, res) => {
  // Obtenemos el ID de la URL (ej: /api/admin/categorias/5)
  const categoriaId = req.params.id;

  // !! IMPORTANTE: En una app real, ¡deberías verificar si algún PRODUCTO usa esta categoría primero!
  // Por ahora, borraremos directamente.
  const sql = "DELETE FROM Categorias WHERE id_categoria = ?";

  db.query(sql, [categoriaId], (err, result) => {
    if (err) {
      console.error("Error al borrar categoría:", err);
      return res.status(500).json({ message: "Error interno del servidor." });
    }
    // Si no se afectó ninguna fila, la categoría no existía
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Categoría no encontrada." });
    }
    console.log("Categoría borrada con ID:", categoriaId);
    // Enviamos respuesta exitosa (código 200 o 204 No Content también es común para delete)
    res.status(200).json({ message: "Categoría borrada exitosamente." });
  });
});

// Ruta para actualizar una  categoría (Admin)
app.put("/api/admin/categorias/:id", (req, res) => {
  const categoriaId = req.params.id;
  // Obtenemos el nuevo nombre del cuerpo de la petición
  const { nombre } = req.body;

  // Validación simple
  if (!nombre) {
    return res.status(400).json({ message: "El nombre es obligatorio." });
  }

  // También actualizamos quién la registró (asumimos que el admin logueado hizo la edición)
  // Idealmente, obtendríamos este ID de un token seguro, pero simularemos por ahora
  const id_usuario_actualizacion = req.body.id_usuario_actualizacion || null; // Obtenemos el ID del admin si se envió

  const sql = `
        UPDATE Categorias
        SET nombre = ?, id_usuario_registro = ?
        WHERE id_categoria = ?
    `;

  db.query(
    sql,
    [nombre, id_usuario_actualizacion, categoriaId],
    (err, result) => {
      if (err) {
        console.error("Error al actualizar categoría:", err);
        return res.status(500).json({ message: "Error interno del servidor." });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Categoría no encontrada." });
      }

      // Recuperamos la categoría actualizada para enviarla de vuelta al frontend
      const sqlSelect = `
            SELECT
                c.id_categoria, c.nombre, c.fecha_registro,
                u.nombre AS nombre_usuario
            FROM Categorias c
            LEFT JOIN Usuarios u ON c.id_usuario_registro = u.id_usuario
            WHERE c.id_categoria = ?
        `;
      db.query(sqlSelect, [categoriaId], (err, rows) => {
        if (err) {
          return res.status(500).json({
            message: "Categoría actualizada, pero error al recuperarla.",
          });
        }
        // Devolvemos la fila actualizada
        res.status(200).json(rows[0]);
      });
    }
  );
});

// Ruta para obtener productos (Admin)
app.get("/api/admin/productos", (req, res) => {
  // Obtenemos todos los datos del producto y el nombre de su categoría
  const sql = `
        SELECT 
            p.*,  -- Selecciona todas las columnas de Productos
            c.nombre AS nombre_categoria
        FROM Productos p
        LEFT JOIN Categorias c ON p.id_categoria = c.id_categoria
        ORDER BY p.id_producto;
    `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al consultar productos (admin):", err);
      return res.status(500).json({ message: "Error interno del servidor." });
    }
    res.status(200).json(results);
  });
});

// Ruta para crear un nuevo producto (Admin)
app.post("/api/admin/productos", upload.single("imagen"), (req, res) => {
  const idCategoria = req.body.id_categoria;
  const nombreCarpeta = categoriaMap[idCategoria];
  const imagen_url = req.file
    ? `/img/${nombreCarpeta}/${req.file.filename}`
    : null;

  const { nombre, descripcion, precio, stock, id_categoria } = req.body;

  if (!nombre || !precio || !stock || !id_categoria) {
    if (req.file) {
      fs.unlink(req.file.path);
    }
    return res.status(400).json({
      message: "Faltan campos obligatorios: nombre, precio, stock, categoría.",
    });
  }

  const sql = `
        INSERT INTO Productos 
        (nombre, descripcion, precio, stock, id_categoria, imagen_url) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;

  db.query(
    sql,
    [nombre, descripcion, precio, stock, id_categoria, imagen_url],
    (err, result) => {
      if (err) {
        console.error("Error al crear producto:", err);
        if (req.file) {
          fs.unlink(req.file.path);
        }
        return res
          .status(500)
          .json({ message: "Error interno al guardar producto." });
      }

      const newProductId = result.insertId;
      const sqlSelect = `
            SELECT p.*, c.nombre AS nombre_categoria
            FROM Productos p
            JOIN Categorias c ON p.id_categoria = c.id_categoria
            WHERE p.id_producto = ?
        `;
      db.query(sqlSelect, [newProductId], (err, rows) => {
        if (err)
          return res
            .status(500)
            .json({ message: "Producto creado, pero error al recuperarlo." });
        res.status(201).json(rows[0]);
      });
    }
  );
});

// Ruta para actualizar producto (Admin)
app.put("/api/admin/productos/:id", upload.single("imagen"), (req, res) => {
  const productId = req.params.id;
  const {
    nombre,
    descripcion,
    precio,
    stock,
    id_categoria,
    imagen_url_existente,
  } = req.body;

  const idCategoria = req.body.id_categoria;
  const nombreCarpeta = categoriaMap[idCategoria];

  let nueva_imagen_url = imagen_url_existente;
  if (req.file) {
    nueva_imagen_url = `/img/${nombreCarpeta}/${req.file.filename}`;
  }

  if (!nombre || !precio || !stock || !id_categoria) {
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err)
          console.error(
            "Error al borrar archivo después de fallo de validación:",
            err
          );
      });
    }
    return res.status(400).json({ message: "Faltan campos obligatorios." });
  }

  const final_imagen_url = nueva_imagen_url || imagen_url_existente;

  const sql = `
        UPDATE Productos
        SET nombre=?, descripcion=?, precio=?, stock=?, id_categoria=?, imagen_url=?
        WHERE id_producto=?
    `;

  db.query(
    sql,
    [
      nombre,
      descripcion,
      precio,
      stock,
      id_categoria,
      nueva_imagen_url,
      productId,
    ],
    (err, result) => {
      if (err) {
        console.error("Error al actualizar producto:", err);
        if (req.file) {
          fs.unlink(req.file.path, (err) => {
            if (err)
              console.error(
                "Error al borrar archivo después de fallo SQL:",
                err
              );
          });
        }
        return res
          .status(500)
          .json({ message: "Error interno al actualizar." });
      }

      const sqlSelect = `
            SELECT p.*, c.nombre AS nombre_categoria
            FROM Productos p
            JOIN Categorias c ON p.id_categoria = c.id_categoria
            WHERE p.id_producto = ?
        `;
      db.query(sqlSelect, [productId], (err, rows) => {
        if (err)
          return res
            .status(500)
            .json({ message: "Producto actualizado, error al recuperarlo." });
        res.status(200).json(rows[0]);
      });
    }
  );
});

// Ruta para eliminar producto (Admin)
app.delete("/api/admin/productos/:id", (req, res) => {
  const productId = req.params.id;

  // 1. Buscamos la URL de la imagen
  const sqlFindImage = "SELECT imagen_url FROM Productos WHERE id_producto = ?";

  db.query(sqlFindImage, [productId], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Error al buscar URL de imagen." });

    const imagen_url = results[0]?.imagen_url;

    // 2. Borrar el producto de la BD
    const sqlDelete = "DELETE FROM Productos WHERE id_producto = ?";
    db.query(sqlDelete, [productId], (err, result) => {
      if (err) {
        console.error("Error al borrar producto:", err);
        return res
          .status(500)
          .json({ message: "Error interno al borrar producto." });
      }

      // 3. Borramos el archivo del disco (si existe y la BD fue exitosa)
      if (result.affectedRows > 0 && imagen_url) {
        const filePath = path.join(
          __dirname,
          "..",
          "Frontend",
          "public",
          imagen_url
        );
        fs.unlink(filePath, (unlinkErr) => {
          // Usamos fs.unlink (callback)
          if (unlinkErr)
            console.error("Error al borrar archivo del disco:", unlinkErr);
        });
      }

      res.status(200).json({ message: "Producto eliminado exitosamente." });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
