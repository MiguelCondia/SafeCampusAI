require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../src/config/db');
const { analizarYGuardar } = require('../src/services/analisisService');

(async () => {
    const { rows } = await db.query(
        `SELECT r.id_reporte, r.titulo, r.descripcion FROM reporte r
        LEFT JOIN analisis_ia a ON a.id_reporte = r.id_reporte WHERE a.id_reporte IS NULL`
    );
    for (const r of rows) {
        await analizarYGuardar(r.id_reporte, r.titulo, r.descripcion);
        console.log('Analizado reporte', r.id_reporte);
    }
    process.exit(0);
})();