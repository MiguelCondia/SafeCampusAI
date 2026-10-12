const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const reporteRoutes = require('./routes/reporteRoutes');     // NUEVO
const catalogoRoutes = require('./routes/catalogoRoutes');   // NUEVO

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', proyecto: 'SafeCampus AI' });
});

app.get('/api/health/db', async (req, res) => {
    try {
        const resultado = await db.query('SELECT COUNT(*) FROM categoria');
        res.json({
            status: 'ok',
            baseDeDatos: 'conectada',
            categorias: Number(resultado.rows[0].count),
        });
    } catch (error) {
        console.error('Error de conexión a la BD:', error.message);
        res.status(500).json({ status: 'error', baseDeDatos: 'sin conexión' });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/reportes', reporteRoutes);     // NUEVO
app.use('/api/catalogos', catalogoRoutes);   // NUEVO

module.exports = app;