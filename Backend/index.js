const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
//const bcrypt = require("bcrypt"); 
// const saltRounds = 10; 
const fs = require("fs");
const PDFDocument = require('pdfkit');
const { default: Stripe } = require("stripe");
const { sendPaymentConfirmation } = require("./emailService");
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- Configuración de la Conexión a MySQL ---
const db = mysql.createConnection({
  host: "w32p8y.h.filess.io",//"localhost",
  user: "fuentesoda_gentlemoon",//"root",
  port:3307,
  password: "5265cbcc033dd99696b1b8cf0574b975acaa0479",//"Cony2025",
  database: "fuentesoda_gentlemoon"//"bd_fuente",
});


db.connect((err) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err);
    return;
  }
  console.log("Conectado exitosamente a la base de datos MySQL.");
});


function dbQueryPromise(sql, params) {
    return new Promise((resolve, reject) => {
        // Ejecuta la consulta usando el objeto de conexión existente
        db.query(sql, params, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

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

const formatEndDate = (date) => {
    // Aseguramos que la fecha final incluya todo el día hasta el final
    return date + ' 23:59:59';
};

// --- Rutas (Endpoints) ---

app.get("/helloword", (req, res) => {
  res.send("Hello World desde el backend de Fuente Sodas!");
});

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
      return res.status(401).json({ message: "El usuario o contraseña son incorrectos." });
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
      return res.status(401).json({ message: "El usuario o contraseña son incorrectos." });
    }

    //El usuario es válido
    console.log("Login exitoso:", user.nombre);

    //Creamos un objeto de usuario para enviar al frontend
    const usuarioParaFrontend = {
      id: user.id_usuario,
      nombre: user.nombre,
      email: user.email,
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

// --- Ruta para agregar productos al carrito
app.post('/api/carrito/agregar', (req, res) => {
    const { id_producto, cantidad,id_usuario } = req.body;
    const cantidadNumerica = parseInt(cantidad, 10);

    if (!id_producto || cantidadNumerica <= 0 || !id_usuario) {
        return res.status(400).json({ message: 'Error: Datos incompletos o cantidad inválida.' });
    }

    const sqlUpdate = `
        UPDATE Carrito 
        SET cantidad = cantidad + ? 
        WHERE id_usuario = ? AND id_producto = ?
    `;

    db.query(sqlUpdate, [cantidadNumerica, id_usuario, id_producto], (err, result) => {
        if (err) {
            console.error("Error al actualizar producto en carrito:", err);
            return res.status(500).json({ message: 'Error interno al actualizar carrito.' });
        }

        if (result.affectedRows === 0) {
            const sqlInsert = `
                INSERT INTO Carrito (id_usuario, id_producto, cantidad) 
                VALUES (?, ?, ?)
            `;
            db.query(sqlInsert, [id_usuario, id_producto, cantidadNumerica], (err, insertResult) => {
                if (err) {
                    console.error("Error al insertar producto en carrito:", err);
                    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                        return res.status(400).json({ message: 'Error: El producto o usuario no existe.' });
                    }
                    return res.status(500).json({ message: 'Error interno al insertar carrito.' });
                }
                res.status(201).json({ message: 'Producto añadido al carrito.' });
            });
        } else {
            res.status(200).json({ message: 'Cantidad del producto incrementada.' });
        }
    });
});

// Ruta para actualizar cantidad de productos en carrito
app.put('/api/carrito/actualizar', (req, res) => {
    const { id_producto, cantidad, id_usuario } = req.body; 
    const cantidadNumerica = parseInt(cantidad, 10);

    if (!id_producto || cantidadNumerica < 0) {
        return res.status(400).json({ message: 'Error: Datos incompletos o cantidad inválida.' });
    }

    if (cantidadNumerica === 0) {
        const sqlDelete = "DELETE FROM Carrito WHERE id_usuario = ? AND id_producto = ?";
        db.query(sqlDelete, [id_usuario, id_producto], (err, result) => {
            if (err) {
                console.error("Error al eliminar producto del carrito:", err);
                return res.status(500).json({ message: 'Error interno al eliminar del carrito.' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Producto no encontrado en el carrito.' });
            }
            res.status(200).json({ message: 'Producto eliminado del carrito.' });
        });
    } else {
        const sqlUpdate = `
            UPDATE Carrito 
            SET cantidad = ? 
            WHERE id_usuario = ? AND id_producto = ?
        `;
        db.query(sqlUpdate, [cantidadNumerica, id_usuario, id_producto], (err, result) => {
            if (err) {
                console.error("Error al actualizar cantidad en carrito:", err);
                return res.status(500).json({ message: 'Error interno al actualizar cantidad.' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Producto no encontrado en el carrito.' });
            }
            res.status(200).json({ message: 'Cantidad actualizada en el carrito.' });
        });
    }
});

//Ruta para eliminar productos del carrito
app.delete('/api/carrito/eliminar/:id', (req, res) => {
    const id_producto = parseInt(req.params.id, 10);
    const id_usuario = req.body.id_usuario;
    
    if (!id_producto) {
        return res.status(400).json({ message: 'Error: ID de producto inválido.' });
    }

    const sqlDelete = "DELETE FROM Carrito WHERE id_usuario = ? AND id_producto = ?";
    
    db.query(sqlDelete, [id_usuario, id_producto], (err, result) => {
        if (err) {
            console.error("Error al eliminar producto del carrito:", err);
            return res.status(500).json({ message: 'Error interno al eliminar del carrito.' });
        }
        
        if (result.affectedRows === 0) {
             return res.status(404).json({ message: 'Producto no encontrado en el carrito.' });
        }
        
        res.status(200).json({ message: 'Producto eliminado del carrito.' });
    });
});

// --- RUTA PARA OBTENER EL CARRITO ---
app.get('/api/carrito/:id', (req, res) => {
  //TODO esto estaba en harcodeado, lo cambie para que tome el id del usuario
    const id_usuario = parseInt(req.params.id, 10);

    if(isNaN(id_usuario)) {
        return res.status(400).json({ message: 'Error: ID de usuario inválido.' });
    }

    const query = `
        SELECT 
            c.idDetalle, 
            c.id_producto, 
            c.cantidad,
            p.nombre, 
            p.precio,
            p.imagen_url
        FROM Carrito c
        JOIN Productos p ON c.id_producto = p.id_producto
        WHERE c.id_usuario = ?
    `;

    db.query(query, [id_usuario], (err, detailedItems) => {
        if (err) {
            console.error("Error al obtener carrito de MySQL:", err);
            return res.status(500).json({ message: 'Error interno del servidor al consultar carrito.' });
        }
        
        let subtotal = 0;
        
        const cartItems = detailedItems.map(item => {
            const precioTotal = item.cantidad * item.precio;
            subtotal += precioTotal;

            return {
                id_producto: item.id_producto,
                nombre: item.nombre,
                precio_unitario: parseFloat(item.precio),
                cantidad: item.cantidad,
                total_producto: parseFloat(precioTotal.toFixed(2)),
                imagen_url: item.imagen_url
            };
        });
        
        const totalPagar = subtotal;

        res.status(200).json({
            items: cartItems,
            subtotal: parseFloat(subtotal.toFixed(2)),
            descuento: 0.00,
            total_a_pagar: parseFloat(totalPagar.toFixed(2))
        });
    });
});

// --- RUTA PARA FINALIZAR PEDIDO (CHECKOUT) ---
// --- NO USES ESTO EN PRODUCCIÓN ---
// Este código asume que 'db' es una conexión única de createConnection()
// y no usa .getConnection() y puede generar bloqueos.

app.post('/api/orden/finalizar', (req, res) => {
    const { total_a_pagar, id_cliente } = req.body;
  
    const id_usuario = id_cliente || 1; 
    const total_fijo = total_a_pagar || 0.00; 

    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ message: 'Error al iniciar transacción.' });
        }

        const pedidoQuery = "INSERT INTO Pedido (idUsuario,fecha, fechaPedido, estado, total,fechaPago) VALUES (?, NOW(),NOW(), ?, ?, NOW())";
        
        db.query(pedidoQuery, [id_usuario, 'PENDIENTE', total_fijo], (err, pedidoResult) => {
            if (err) {
                console.log("error al insertar pedido:", err);
                // Solo podemos hacer rollback
                return db.rollback(() => { 
                    res.status(500).json({ message: 'Error al insertar pedido.' }); 
                });
            }

            const id_pedido = pedidoResult.insertId;
            const cartItemsQuery = "SELECT c.id_producto, c.cantidad,p.precio FROM Carrito c INNER JOIN Productos p ON c.id_producto = p.id_producto WHERE c.id_usuario = ?";
            
            db.query(cartItemsQuery, [id_usuario], (err, cartItems) => {
                if (err || cartItems.length === 0) {
                    return db.rollback(() => { 
                        res.status(400).json({ message: 'El carrito está vacío o hubo un error al leerlo.' }); 
                    });
                }

                const detalleValues = cartItems.map(item => [id_pedido, item.id_producto, item.cantidad, item.precio, item.cantidad * item.precio]); 
                const detalleQuery = "INSERT INTO DetallePedido (idPedido, idProducto, cantidad,precio_u,subtotal) VALUES ?";

                db.query(detalleQuery, [detalleValues], (err) => {
                    if (err) {
                      console.log("error al insertar detalles:", err);
                        return db.rollback(() => { 
                            res.status(500).json({ message: 'Error al insertar detalles.' }); 
                        });
                    }

                    const stockUpdatePromises = cartItems.map(item => {
                        return new Promise((resolve, reject) => {
                            if (item.stock < item.cantidad) {
                                return reject(new Error(`Stock insuficiente para el producto ID: ${item.id_producto}`));
                            }
                            const sqlUpdateStock = "UPDATE Productos SET stock = stock - ? WHERE id_producto = ?";
                            db.query(sqlUpdateStock, [item.cantidad, item.id_producto], (err, result) => {
                                if (err) return reject(err);
                                resolve(result);
                            });
                        });
                    });

                    Promise.all(stockUpdatePromises)
                        .then(() => {
                            const clearCartQuery = "DELETE FROM Carrito WHERE id_usuario = ?";
                            db.query(clearCartQuery, [id_usuario], (err) => {
                                if (err) {
                                    return db.rollback(() => { 
                                        res.status(500).json({ message: 'Error al vaciar el carrito después de actualizar stock.' }); 
                                    });
                                }

                                db.commit(err => {
                                    if (err) {
                                        return db.rollback(() => {
                                            res.status(500).json({ message: 'Error al confirmar (commit) pedido.' });
                                        });
                                    }
                                    
                                    res.status(201).json({ 
                                        message: '¡Pedido realizado y carrito vaciado con éxito!', 
                                        id_pedido: id_pedido 
                                    });
                                });
                            }); 
                        })
                        .catch(err => {
                            console.error("Fallo de Stock/Transacción:", err.message);
                        
                            db.rollback(() => { 
                                getRemainingCart(id_usuario, (remainingCart) => {
                                    res.status(409).json({ 
                                        message: err.message, 
                                        remainingCart: remainingCart
                                    }); 
                                });
                            });
                        });
                    
                });
            });
        });
    });
});

const groupOrderDetails = (rows) => {
    const ordersMap = new Map();

    rows.forEach(row => {
        const orderId = row.ID;

        if (!ordersMap.has(orderId)) {
            ordersMap.set(orderId, {
                ID: row.ID,
                Cliente: row.Cliente,
                Productos: [],
                CantidadTotalProductos: row.CantidadTotal,
                Total: row.Total,
                Estado: row.Estado, 
                Fecha: row.Fecha
            });
        }
        if (row.NombreProducto) {
            ordersMap.get(orderId).Productos.push({
                NombreProducto: row.NombreProducto,
                Cantidad: row.Cantidad,
                PrecioUnitario: row.PrecioUnitario
            });
        }
    });

    return Array.from(ordersMap.values());
};

//Obtener pedidos nuevos
app.get("/api/admin/pedidos/nuevos", (req, res) => {
    const sql = `
        SELECT 
            p.idPedido AS ID, 
            u.nombre AS Cliente, 
            p.total AS Total, 
            p.fecha AS Fecha,
            p.estado AS Estado,
            prod.nombre AS NombreProducto,
            dp.cantidad AS Cantidad,
            dp.precio_u AS PrecioUnitario,
            t.CantidadTotal
        FROM Pedido p
        JOIN Usuarios u ON p.idUsuario = u.id_usuario
        JOIN DetallePedido dp ON p.idPedido = dp.idPedido
        JOIN Productos prod ON dp.idProducto = prod.id_producto
        
        -- Subconsulta para calcular la cantidad total de productos por pedido (t.CantidadTotal)
        JOIN (
            SELECT idPedido, SUM(cantidad) AS CantidadTotal
            FROM DetallePedido
            GROUP BY idPedido
        ) t ON p.idPedido = t.idPedido
        
        WHERE p.estado = 'PENDIENTE'
        ORDER BY p.fecha DESC, p.idPedido, prod.nombre
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error al consultar pedidos nuevos:", err);
            return res.status(500).json({ message: "Error interno del servidor." });
        }
        const pedidosAgrupados = groupOrderDetails(results);
        res.status(200).json(pedidosAgrupados);
    });
});

//Obtener todos los pedidos
app.get("/api/admin/pedidos/otros", (req, res) => {
    const sql = `
        SELECT 
            p.idPedido AS ID, 
            u.nombre AS Cliente, 
            p.total AS Total, 
            p.fecha AS Fecha,
            p.estado AS Estado,
            prod.nombre AS NombreProducto,
            dp.cantidad AS Cantidad,
            dp.precio_u AS PrecioUnitario,
            t.CantidadTotal
        FROM Pedido p
        JOIN Usuarios u ON p.idUsuario = u.id_usuario
        JOIN DetallePedido dp ON p.idPedido = dp.idPedido
        JOIN Productos prod ON dp.idProducto = prod.id_producto

        -- Subconsulta para calcular la cantidad total de productos por pedido (t.CantidadTotal)
        JOIN (
            SELECT idPedido, SUM(cantidad) AS CantidadTotal
            FROM DetallePedido
            GROUP BY idPedido
        ) t ON p.idPedido = t.idPedido

        WHERE p.estado != 'PENDIENTE'
        ORDER BY p.fecha DESC, p.idPedido, prod.nombre
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error al consultar otros pedidos:", err);
            return res.status(500).json({ message: "Error interno del servidor." });
        }
        
        const pedidosAgrupados = groupOrderDetails(results);
        res.status(200).json(pedidosAgrupados);
    });
});

//Operador actualiza el estado del pedido
app.put("/api/admin/pedidos/:id", (req, res) => {
    const idPedido = req.params.id;
    const { nuevoEstado } = req.body; 
    
    if (!nuevoEstado || typeof nuevoEstado !== 'string') {
        return res.status(400).json({ message: "El nuevo estado es requerido." });
    }

    const estadosValidos = ['PENDIENTE', 'EN PREPARACIÓN', 'PEDIDO LISTO', 'ENTREGADO', 'CANCELADO'];
    if (!estadosValidos.includes(nuevoEstado)) {
        return res.status(400).json({ message: "Estado de pedido inválido." });
    }

    const sql = "UPDATE Pedido SET estado = ? WHERE idPedido = ?";

    db.query(sql, [nuevoEstado, idPedido], (err, result) => {
        if (err) {
            console.error("Error al actualizar estado del pedido:", err);
            return res.status(500).json({ message: "Error interno del servidor al actualizar el estado." });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `Pedido con ID ${idPedido} no encontrado.` });
        }

        res.status(200).json({ 
            message: `Estado del pedido ${idPedido} actualizado a ${nuevoEstado}.`,
            idPedido: idPedido 
        });
    });
});


//Historial de pedidos para los usuarios
const groupClientOrderDetails = (rows) => {
    const pedidosMap = new Map();

    rows.forEach(row => {
        const { 
            id, fecha, estado, total, 
            cantidad, nombreProducto, subtotal, precio_u
        } = row;

        if (!pedidosMap.has(id)) {
            pedidosMap.set(id, {
                id: id,
                fecha: fecha,
                estado: estado,
                total: total,
                DetallePedido: [] 
            });
        }
        pedidosMap.get(id).DetallePedido.push({
            nombre: nombreProducto,
            cantidad: cantidad,
            subtotal: subtotal,
            precio_u: precio_u 
        });
    });
    return Array.from(pedidosMap.values());
};

app.get('/api/cliente/pedidos/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = `
        SELECT
            P.idPedido AS id,
            P.fecha,
            P.estado,
            P.total,
            DP.cantidad,
            DP.subtotal,
            DP.precio_u,
            PR.nombre AS nombreProducto  -- Nombre necesario para el resumen en el frontend
        FROM 
            Pedido P
        JOIN 
            DetallePedido DP ON P.idPedido = DP.idPedido
        JOIN 
            Productos PR ON DP.idProducto = PR.id_producto
        WHERE 
            P.idUsuario = ?                 -- FILTRO POR EL ID DEL CLIENTE
        ORDER BY
            P.fecha DESC, P.idPedido;
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error al obtener historial del cliente:', err);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }        

        if (results.length === 0) {
            return res.status(200).json([]);
        }
        const pedidosAgrupados = groupClientOrderDetails(results);
        
        res.status(200).json(pedidosAgrupados);
    });
});

//Actualizar contraseña
app.put("/api/usuarios/cambiar-contrasena/:userId", (req, res) => {
    const userId = req.params.userId;
    const { currentPassword, newPassword } = req.body; 

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "La contraseña actual y la nueva contraseña son requeridas." });
    }


    const selectSql = "SELECT password FROM Usuarios WHERE id_usuario = ?"; 
    
    db.query(selectSql, [userId], (err, results) => {
        if (err) {
            console.error("Error al buscar el usuario:", err);
            return res.status(500).json({ message: "Error interno del servidor." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        const storedPassword = results[0].password;

        if (currentPassword !== storedPassword) {
            return res.status(401).json({ message: "La contraseña actual es incorrecta." });
        }

        const updateSql = "UPDATE Usuarios SET password = ? WHERE id_usuario = ?"; 

        db.query(updateSql, [newPassword, userId], (updateErr, result) => {
            if (updateErr) {
                console.error("Error al actualizar la contraseña:", updateErr);
                return res.status(500).json({ message: "Error interno del servidor al actualizar la contraseña.", dbError: updateErr.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Usuario no encontrado después de la verificación." });
            }

            res.status(200).json({ message: "Contraseña actualizada exitosamente." });
        });

    });
});

//Lista de clientes para admin
app.get("/api/usuarios/clientes", (req, res) => {
    const sql = `
        SELECT
            id_usuario AS id, 
            nombre, 
            email, 
            celular,
            rol,
            fecha_registro  
        FROM 
            Usuarios 
        WHERE 
            rol = 'cliente' 
        ORDER BY
            fecha_registro DESC;
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener la lista de clientes:', err);
            return res.status(500).json({ message: 'Error interno del servidor al consultar clientes.' });
        }
        res.status(200).json(results);
    });
});

//Reporte de Ventas para admin
app.get("/api/reports/sales", async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: "Se requieren startDate y endDate." });
    }

    const sql = `
        SELECT
            DATE(fechaPedido) AS date,
            SUM(total) AS total,
            COUNT(*) AS transaction_count
        FROM
            Pedido
        WHERE
            fechaPedido BETWEEN ? AND ?
        GROUP BY
            DATE(fechaPedido)
        ORDER BY
            date;
    `;

    try {
        const results = await dbQueryPromise(sql, [startDate, endDate + ' 23:59:59']);
        
        const formattedResults = results.map(row => ({
            date: row.date 
                  ? (row.date instanceof Date 
                      ? row.date.toISOString().split('T')[0] 
                      : row.date)
                  : 'N/A', 
            total: parseFloat(row.total), 
            count: row.transaction_count
        }));

        res.status(200).json(formattedResults);
    } catch (err) {
        console.error('Error al obtener el reporte de ventas:', err);
        return res.status(500).json({ message: 'Error interno del servidor al consultar ventas.', dbError: err.message });
    }
});



app.get("/api/reports/sales/pdf", (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: "Se requieren startDate y endDate para el PDF." });
    }

    const detailSql = `
        SELECT 
            idPedido, 
            fechaPedido, 
            total, 
            estado
        FROM 
            Pedido
        WHERE 
            fechaPedido BETWEEN ? AND ?
        ORDER BY 
            fechaPedido ASC;
    `;
    
    const endOfDay = formatEndDate(endDate); 
    db.query(detailSql, [startDate, endOfDay], (err, results) => {
        if (err) {
            console.error('Error al consultar datos para el PDF:', err);
            return res.status(500).json({ 
                message: 'Error interno del servidor al consultar pedidos.', 
                dbError: err.message 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: "No se encontraron ventas en el rango para generar el PDF." });
        }

        // GENERACIÓN DEL PDF

        // titulo del PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Reporte_Ventas_${startDate}_a_${endDate}.pdf"`);

        //Se genera el PDF
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        doc.pipe(res);

        let totalVentas = 0;
        
        results.forEach(row => {
            totalVentas += parseFloat(row.total || 0); 
        });
        const totalTransacciones = results.length;

        // Contenido del PDF 
        doc.fontSize(18).text('Reporte de Ventas Detallado', { align: 'center' });
        doc.fontSize(12).text(`Rango de Fechas: ${startDate} al ${endDate}`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(14).text('Resumen:', { underline: true });
        doc.fontSize(10).text(`Transacciones Totales: ${totalTransacciones}`);
        doc.fontSize(10).text(`Monto Total de Ventas: S/. ${totalVentas.toFixed(2)}`);
        doc.moveDown();


        
        const PADDING = 5; 
        const LINE_HEIGHT = 18; 
        const LINE_WIDTH = 0.5; 
        const tableTop = doc.y;
        const startX = 50;
        
        const colWidths = [100, 100, 130, 70]; 
        

        const colStart = [
            startX,                                                              // ID Pedido
            startX + colWidths[0],                                               // Fecha
            startX + colWidths[0] + colWidths[1],                                // Estado
            startX + colWidths[0] + colWidths[1] + colWidths[2]                  // Total
        ];


        const endX = startX + colWidths.reduce((a, b) => a + b, 0); 
        
        const headers = ['ID Pedido', 'Fecha', 'Estado', 'Total'];

        // ENCABEZADOS DE LA TABLA
        let currentY = tableTop;

        // LÍNEA SUPERIOR DE LA TABLA
        doc.lineWidth(LINE_WIDTH).moveTo(startX, currentY).lineTo(endX, currentY).stroke();
        
        // Escribir encabezados
        doc.fontSize(10).font('Helvetica-Bold');
        headers.forEach((header, i) => {
            const width = colWidths[i];
            const alignment = i === 3 ? 'right' : 'left';
            doc.text(header, colStart[i] + PADDING, currentY + PADDING, {
                width: width - PADDING * 2,
                align: alignment
            });
        });

        currentY += LINE_HEIGHT + PADDING;
        
        // DIBUJAR LÍNEA BAJO ENCABEZADOS
        doc.lineWidth(LINE_WIDTH).moveTo(startX, currentY).lineTo(endX, currentY).stroke();

        // 5. DIBUJAR LAS FILAS DE DATOS
        doc.font('Helvetica'); 
        results.forEach((row, index) => {

            if (currentY + LINE_HEIGHT > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                currentY = 50;
                
                doc.lineWidth(LINE_WIDTH).moveTo(startX, currentY).lineTo(endX, currentY).stroke();
                
                doc.fontSize(10).font('Helvetica-Bold');
                headers.forEach((header, i) => {
                    const width = colWidths[i];
                    const alignment = i === 3 ? 'right' : 'left';
                    doc.text(header, colStart[i] + PADDING, currentY + PADDING, {
                        width: width - PADDING * 2,
                        align: alignment
                    });
                });
                
                currentY += LINE_HEIGHT + PADDING;
                doc.lineWidth(LINE_WIDTH).moveTo(startX, currentY).lineTo(endX, currentY).stroke();
                doc.font('Helvetica');
            }
            
            const rowY = currentY + PADDING;
            
            let dateStr = 'N/A';
            if (row.fechaPedido) {
                if (row.fechaPedido instanceof Date) {
                    dateStr = row.fechaPedido.toISOString().split('T')[0];
                } else {
                    dateStr = String(row.fechaPedido).substring(0, 10);
                }
            }
            const totalStr = `S/. ${parseFloat(row.total).toFixed(2)}`;
            
            const rowData = [
                String(row.idPedido),
                dateStr,
                row.estado,
                totalStr
            ];

            doc.fontSize(10);
            rowData.forEach((data, i) => {
                const width = colWidths[i];
                const alignment = i === 3 ? 'right' : 'left';

                doc.text(data, colStart[i] + PADDING, rowY, {
                    width: width - PADDING * 2,
                    align: alignment
                });
            });

            const cellHeight = currentY + LINE_HEIGHT;
            
            currentY += LINE_HEIGHT;
            doc.lineWidth(LINE_WIDTH).moveTo(startX, currentY).lineTo(endX, currentY).stroke();
            doc.lineWidth(LINE_WIDTH);
            doc.moveTo(startX, currentY - LINE_HEIGHT).lineTo(startX, currentY).stroke();
            colStart.slice(1).forEach(colX => {
                doc.moveTo(colX, currentY - LINE_HEIGHT).lineTo(colX, currentY).stroke();
            });     
            doc.moveTo(endX, currentY - LINE_HEIGHT).lineTo(endX, currentY).stroke();
        });

        doc.end();
    });
});

// Filtrar pedidos por estado
app.get("/api/pedidos", (req, res) => {
    const { estado } = req.query; 

    let sql = `
        SELECT 
            p.idPedido, 
            u.nombre AS nombre_cliente,  
            DATE(p.fechaPedido) AS fecha, 
            p.total,                 
            p.estado
        FROM 
            Pedido p                
        JOIN 
            Usuarios u ON p.idUsuario = u.id_usuario 
    `;

    const params = [];
    if (estado && estado !== 'todos') {
        sql += ` WHERE p.estado = ?`;
        params.push(estado); 
    }
    sql += ` ORDER BY p.fechaPedido DESC`;

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('--- ERROR CRÍTICO EN LA CONSULTA DE PEDIDOS ---');
            console.error('Consulta SQL que falló:', sql);
            console.error('Parámetros:', params);
            console.error('Error de BD:', err);
            return res.status(500).json({ 
                message: 'Error interno del servidor al consultar pedidos. Revise la consola del servidor para detalles.',
                dbError: err.message
            });
        }
        res.status(200).json(results);
    });
});


app.post('/api/pagos/confirmar-pago', async (req, res) => {
  const { email, details } = req.body;

  // Validación simple
  if (!email || !details) {
    return res.status(400).json({ error: 'Faltan datos (email o details).' });
  }

  try {
    // Aquí es donde llamas a tu lógica de envío de correo
    console.log(`Iniciando envío de correo a ${email}...`);
    await sendPaymentConfirmation(email, details);
    
    // Respondes al cliente (sea el frontend o un webhook)
    res.status(200).json({ message: 'Correo de confirmación enviado exitosamente.' });

  } catch (error) {
    console.error('Error en la ruta /api/pagos/confirmar-pago:', error);
    res.status(500).json({ error: 'Error interno del servidor al enviar el correo.' });
  }
});

//integración con Stripe

const stripe = new Stripe("process.env.STRIPE_SECRET_KEY");

app.post('/api/pagos/create-payment-intent', async (req, res) => {
  try {
    console.log('--- Creando Payment Intent ---');
    console.log('Datos recibidos en el backend:', req.body);

    const { total_a_pagar, id_cliente } = req.body;

    if (total_a_pagar == null) {
      return res.status(400).json({ message: 'total_a_pagar es requerido' });
    }

    // Asegúrate de que sea número
    const montoNumero = Number(total_a_pagar);
    if (Number.isNaN(montoNumero) || montoNumero <= 0) {
      return res.status(400).json({ message: 'total_a_pagar inválido' });
    }

    // Stripe espera el monto en centavos (unidad mínima)
    const amountInCents = Math.round(montoNumero);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'pen',
      description: 'Pago carrito tienda online',
      metadata: {
        id_cliente: id_cliente ? String(id_cliente) : '',
      },
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error('Error creando PaymentIntent:', err);
    return res.status(500).json({ message: 'Error creando el pago' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
