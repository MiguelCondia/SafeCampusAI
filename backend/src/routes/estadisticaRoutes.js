const express = require('express');
const db = require('../config/db');
const { verificarToken, permitirRoles } = require('../middlewares/auth');

const router = express.Router();

// GET /api/estadisticas  (RF11) - solo administrador
// Devuelve en UNA sola respuesta todo lo que necesita el dashboard
router.get('/', verificarToken, permitirRoles('administrador'), async (req, res) => {
    try {
        // COUNT en PostgreSQL devuelve un tipo "bigint" que llega como texto.
        // El "::int" lo convierte a entero para que llegue como número
        const total = await db.query('SELECT COUNT(*)::int AS cantidad FROM reporte');

        // Reportes por estado. LEFT JOIN desde estado_reporte para que aparezcan
        // TODOS los estados, incluso los que tienen 0 reportes
        const porEstado = await db.query(
        `SELECT e.nombre, COUNT(r.id_reporte)::int AS cantidad
        FROM estado_reporte e
        LEFT JOIN reporte r ON r.id_estado = e.id_estado
        GROUP BY e.id_estado, e.nombre
        ORDER BY e.id_estado`
        );

        // Reportes por prioridad. COALESCE reemplaza NULL por un texto:
        // los reportes sin clasificar (aún sin IA) aparecen como "Sin clasificar"
        const porPrioridad = await db.query(
        `SELECT COALESCE(prioridad, 'Sin clasificar') AS nombre, COUNT(*)::int AS cantidad
        FROM reporte
        GROUP BY COALESCE(prioridad, 'Sin clasificar')`
        );

        // Reportes por categoría (RF11)
        const porCategoria = await db.query(
        `SELECT COALESCE(c.nombre, 'Sin categoría') AS nombre, COUNT(*)::int AS cantidad
        FROM reporte r
        LEFT JOIN categoria c ON c.id_categoria = r.id_categoria
        GROUP BY COALESCE(c.nombre, 'Sin categoría')
        ORDER BY cantidad DESC`
        );

        // Zonas con más incidentes (base del RF13). Mostramos las 5 principales
        const porBloque = await db.query(
        `SELECT COALESCE(u.bloque, 'Sin bloque') AS nombre, COUNT(*)::int AS cantidad
        FROM reporte r
        LEFT JOIN ubicacion u ON u.id_ubicacion = r.id_ubicacion
        GROUP BY COALESCE(u.bloque, 'Sin bloque')
        ORDER BY cantidad DESC
        LIMIT 5`
        );

        res.json({
        total: total.rows[0].cantidad,
        por_estado: porEstado.rows,
        por_prioridad: porPrioridad.rows,
        por_categoria: porCategoria.rows,
        por_bloque: porBloque.rows,
        });
    } catch (error) {
        console.error('Error al calcular estadísticas:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;