// bcrypt: cifra contraseñas con un hash de una sola vía (no se puede "descifrar")
const bcrypt = require('bcrypt');

// jsonwebtoken: crea y verifica los tokens de sesión
const jwt = require('jsonwebtoken');

// Nuestra conexión a PostgreSQL (creada en el Paso 2)
const db = require('../config/db');

// Función auxiliar: crea un token con los datos mínimos del usuario.
// Guardamos id y rol dentro del token para saber quién es y qué puede hacer
// sin consultar la BD en cada petición.
function generarToken(usuario) {
    return jwt.sign(
        { id: usuario.id_usuario, rol: usuario.rol }, // payload (contenido del token)
        process.env.JWT_SECRET,                        // clave con la que se firma
        { expiresIn: '8h' }                            // el token deja de servir tras 8 horas
    );
}

// -------------------------------------------------------
// POST /api/auth/registro  (RF01)
// -------------------------------------------------------
async function registrar(req, res) {
    try {
        // Extraemos los datos que envía el cliente en el cuerpo de la petición
        const { nombre, correo, contrasena, telefono } = req.body;

        // Validación: los tres campos principales son obligatorios (RNF09)
        if (!nombre || !correo || !contrasena) {
            return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
        }

        // Validación del formato del correo con una expresión regular simple
        const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
        if (!correoValido) {
            return res.status(400).json({ error: 'El correo no tiene un formato válido' });
        }

        // Validación: contraseña de mínimo 8 caracteres (RNF03)
        if (contrasena.length < 8) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        }

        // Normalizamos el correo a minúsculas para que "Ana@x.com" y "ana@x.com" sean el mismo
        const correoNormalizado = correo.trim().toLowerCase();

        // Verificamos que el correo no esté ya registrado
        const existente = await db.query(
            'SELECT id_usuario FROM usuario WHERE correo = $1',
            [correoNormalizado]
        );
        if (existente.rows.length > 0) {
            return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
        }

        // Ciramos la contraseña. El 10 son las "rondas de sal": más rondas = más
        // seguro pero más lento. 10 es el valor estándar.
        const hash = await bcrypt.hash(contrasena, 10);

        // Insertamos el usuario. El rol NO viene del cliente: siempre 'estudiante'.
        // RETURNING nos devuelve la fila creada sin hacer otra consulta.
        const resultado = await db.query(
            `INSERT INTO usuario (nombre, correo, contrasena, rol, telefono)
            VALUES ($1, $2, $3, 'estudiante', $4)
            RETURNING id_usuario, nombre, correo, rol`,
            [nombre.trim(), correoNormalizado, hash, telefono || null]
        );

        const usuario = resultado.rows[0];

        // 201 = "Creado". Devolvemos el usuario (SIN contraseña) y su token
        res.status(201).json({ usuario, token: generarToken(usuario) });
    } catch (error) {
        console.error('Error en registro:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

// -------------------------------------------------------
// POST /api/auth/login  (RF02)
// -------------------------------------------------------
async function login(req, res) {
    try {
        const { correo, contrasena } = req.body;

        if (!correo || !contrasena) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
        }

        // Buscamos al usuario por correo
        const resultado = await db.query(
            'SELECT * FROM usuario WHERE correo = $1',
            [correo.trim().toLowerCase()]
        );
        const usuario = resultado.rows[0];

        // Mensaje genérico a propósito: si dijéramos "el correo no existe" vs
        // "contraseña incorrecta", un atacante podría descubrir qué correos están registrados
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Una cuenta desactivada (estado = false) no puede iniciar sesión
        if (!usuario.estado) {
            return res.status(403).json({ error: 'La cuenta está desactivada' });
        }

        // bcrypt.compare cifra la contraseña recibida y la compara con el hash guardado
        const coincide = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!coincide) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Todo bien: devolvemos los datos públicos del usuario y el token.
        // Ojo: no incluimos "contrasena" en la respuesta.
        res.json({
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol,
        },
        token: generarToken(usuario),
        });
    } catch (error) {
        console.error('Error en login:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

// -------------------------------------------------------
// GET /api/auth/me
// Devuelve los datos del usuario que tiene la sesión activa.
// La app lo usará al abrirse para saber si el token sigue siendo válido.
// -------------------------------------------------------
async function perfil(req, res) {
    try {
        // req.usuario lo llena el middleware verificarToken (ver 3.2)
        const resultado = await db.query(
            'SELECT id_usuario, nombre, correo, rol, telefono FROM usuario WHERE id_usuario = $1',
            [req.usuario.id]
        );
        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('Error al obtener perfil:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

// Exportamos las tres funciones para usarlas en las rutas
module.exports = { registrar, login, perfil };