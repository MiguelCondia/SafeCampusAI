const express = require('express');
const db = require('../config/db');
const { verificarToken } = require('../middlewares/auth');

const router = express.Router();

// GET /api/catalogos: devuelve categorías y estados en una sola respuesta,
// para que la app haga una sola petición al abrir el formulario
router.get('/', verificarToken, async (req, res) => {
    try {
        const categorias = await db.query(
            'SELECT id_categoria, nombre, descripcion FROM categoria ORDER BY nombre'
        );
        const estados = await db.query(
            'SELECT id_estado, nombre FROM estado_reporte ORDER BY id_estado'
        );
        res.json({ categorias: categorias.rows, estados: estados.rows });
    } catch (error) {
        console.error('Error al obtener catálogos:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;