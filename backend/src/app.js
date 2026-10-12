const express = require('express');
const cors = require('cors');
const db = require('./config/db'); // NUEVO: importamos la conexión a la BD

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', proyecto: 'SafeCampus AI' });
});

// NUEVO: ruta que verifica que la BD responde y que los datos iniciales existen
app.get('/api/health/db', async (req, res) => {
    try {
    // Contamos cuántas categorías hay; debería devolver 10
        const resultado = await db.query('SELECT COUNT(*) FROM categoria');
        res.json({
            status: 'ok',
            baseDeDatos: 'conectada',
        categorias: Number(resultado.rows[0].count), // COUNT llega como texto, lo pasamos a número
        });
    } catch (error) {
        // Si algo falla, respondemos con error 500 y mostramos el motivo en consola
        console.error('Error de conexión a la BD:', error.message);
        res.status(500).json({ status: 'error', baseDeDatos: 'sin conexión' });
    }
});

module.exports = app;