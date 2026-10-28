const db = require('../config/db');
const { analizarReporte } = require('./iaService');

// Analiza un reporte ya guardado y registra el resultado.
// No lanza errores hacia afuera: un fallo aquí no debe afectar al usuario.
async function analizarYGuardar(idReporte, titulo, descripcion, categoriaElegida) {
    try {
        const r = await analizarReporte(titulo, descripcion);

        const cliente = await db.getClient();
        try {
        await cliente.query('BEGIN');

        // Resumen de riesgo: tipo + probabilidad/impacto, para mostrarlo al admin
        const riesgo = `${r.tipo_riesgo} (prob. ${r.probabilidad}, impacto ${r.impacto})`.slice(0, 100);

        await cliente.query(
            `INSERT INTO analisis_ia (id_reporte, categoria_sugerida, prioridad_sugerida, riesgo_detectado, recomendaciones, origen)
            VALUES ($1,$2,$3,$4,$5,$6)
            ON CONFLICT (id_reporte) DO UPDATE SET categoria_sugerida=$2, prioridad_sugerida=$3,
            riesgo_detectado=$4, recomendaciones=$5, origen=$6, fecha_analisis=NOW()`,
            [idReporte, r.categoria, r.prioridad, riesgo, r.recomendacion, r.origen]
        );

        // Prioridad al reporte; la categoría solo si el estudiante no eligió una
        await cliente.query(
            `UPDATE reporte SET prioridad = $1,
            id_categoria = COALESCE(id_categoria, (SELECT id_categoria FROM categoria WHERE nombre = $2))
            WHERE id_reporte = $3`,
            [r.prioridad, r.categoria, idReporte]
        );

        // Alerta para prioridad Alta o Crítica
        if (['Alto', 'Crítico'].includes(r.prioridad)) {
            await cliente.query(
            `INSERT INTO alerta (id_reporte, tipo, mensaje, nivel) VALUES ($1,'prioridad',$2,$3)`,
            [idReporte, `Reporte de prioridad ${r.prioridad}: ${titulo}`.slice(0, 200), r.prioridad]
            );
        }
        await cliente.query('COMMIT');
        } catch (e) {
        await cliente.query('ROLLBACK');
        throw e;
        } finally {
        cliente.release();
        }
    } catch (e) {
        console.error('No se pudo guardar el análisis:', e.message);
    }
}

module.exports = { analizarYGuardar };