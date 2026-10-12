const express = require('express');
const { registrar, login, perfil } = require('../controllers/authController');
const { verificarToken, permitirRoles } = require('../middlewares/auth');

// Router: un "mini app" de Express para agrupar rutas relacionadas
const router = express.Router();

// Rutas públicas (no requieren token)
router.post('/registro', registrar);
router.post('/login', login);

// Ruta protegida: cualquier usuario con sesión
router.get('/me', verificarToken, perfil);

// Ruta de PRUEBA solo para administradores. Sirve para comprobar que los roles
// funcionan; la puedes borrar más adelante.
router.get('/solo-admin', verificarToken, permitirRoles('administrador'), (req, res) => {
    res.json({ mensaje: 'Hola administrador, tienes acceso' });
});

module.exports = router;