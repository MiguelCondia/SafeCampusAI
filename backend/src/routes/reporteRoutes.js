const express = require('express');
const multer = require('multer');
const { subirEvidencia } = require('../controllers/evidenciaController');
const {
    crearReporte, misReportes, listarTodos, obtenerReporte, cambiarEstado,
} = require('../controllers/reporteController');
const { verificarToken, permitirRoles } = require('../middlewares/auth');

const router = express.Router();

// Todas las rutas de reportes exigen sesión iniciada.
// router.use aplica verificarToken a TODAS las rutas definidas debajo
router.use(verificarToken);

// multer guarda el archivo en memoria (lo procesamos y subimos a Storage; no se escribe en disco)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } });

// Envoltorio para devolver un 400 claro cuando el archivo es demasiado grande
function recibirArchivo(req, res, next) {
    upload.single('archivo')(req, res, (err) => {
        if (err) {
            const mensaje = err.code === 'LIMIT_FILE_SIZE' ? 'La imagen supera los 8 MB' : 'No se pudo procesar el archivo';
            return res.status(400).json({ error: mensaje });
        }
        next();
    });
}

router.post('/:id/evidencias', recibirArchivo, subirEvidencia);

router.post('/', crearReporte);                                   // cualquier usuario
router.get('/mios', misReportes);                                 // cualquier usuario
router.get('/', permitirRoles('administrador'), listarTodos);     // solo admin

// IMPORTANTE: '/mios' debe ir ANTES de '/:id'. Si no, Express interpretaría
// la palabra "mios" como si fuera un id y daría error.
router.get('/:id', obtenerReporte);
router.patch('/:id/estado', permitirRoles('administrador'), cambiarEstado);

module.exports = router;