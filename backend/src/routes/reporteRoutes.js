const express = require('express');
const {
    crearReporte, misReportes, listarTodos, obtenerReporte, cambiarEstado,
} = require('../controllers/reporteController');
const { verificarToken, permitirRoles } = require('../middlewares/auth');

const router = express.Router();

// Todas las rutas de reportes exigen sesión iniciada.
// router.use aplica verificarToken a TODAS las rutas definidas debajo
router.use(verificarToken);

router.post('/', crearReporte);                                   // cualquier usuario
router.get('/mios', misReportes);                                 // cualquier usuario
router.get('/', permitirRoles('administrador'), listarTodos);     // solo admin

// IMPORTANTE: '/mios' debe ir ANTES de '/:id'. Si no, Express interpretaría
// la palabra "mios" como si fuera un id y daría error.
router.get('/:id', obtenerReporte);
router.patch('/:id/estado', permitirRoles('administrador'), cambiarEstado);

module.exports = router;