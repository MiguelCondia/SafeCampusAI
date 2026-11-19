const sharp = require('sharp');
const db = require('../config/db');
const { subirImagen, borrarImagen } = require('../services/storageService');

const MAX_POR_REPORTE = 3;

// POST /api/reportes/:id/evidencias   (campo "archivo", multipart/form-data)
async function subirEvidencia(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Id de reporte inválido' });
    if (!req.file) return res.status(400).json({ error: 'Adjunta una imagen en el campo "archivo"' });

    try {
        // 1) El reporte debe existir y ser del usuario (o ser administrador)
        const reporte = await db.query('SELECT id_usuario FROM reporte WHERE id_reporte = $1', [id]);
        if (reporte.rows.length === 0) return res.status(404).json({ error: 'Reporte no encontrado' });
        const esDueno = reporte.rows[0].id_usuario === req.usuario.id;
        if (req.usuario.rol !== 'administrador' && !esDueno) {
        return res.status(404).json({ error: 'Reporte no encontrado' }); // 404: no revelamos que existe
        }

        // 2) Máximo de fotos por reporte
        const cantidad = await db.query('SELECT COUNT(*)::int AS n FROM evidencia WHERE id_reporte = $1', [id]);
        if (cantidad.rows[0].n >= MAX_POR_REPORTE) {
        return res.status(400).json({ error: `Máximo ${MAX_POR_REPORTE} fotos por reporte` });
        }

        // 3) Procesar con sharp. Si el archivo no es una imagen real, lanza error y se rechaza.
        //    rotate() aplica la orientación EXIF; al recodificar sin withMetadata(), los metadatos
        //    (incluida la ubicación GPS de la foto) se eliminan.
        let imagen;
        try {
        imagen = await sharp(req.file.buffer)
            .rotate()
            .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
        } catch (e) {
        return res.status(400).json({ error: 'El archivo no es una imagen válida' });
        }

        // 4) Guardar en Storage y registrar en la base de datos
        const ruta = await subirImagen(id, imagen);
        try {
        const fila = await db.query(
            `INSERT INTO evidencia (id_reporte, url_archivo, tipo_archivo)
            VALUES ($1, $2, 'image/jpeg') RETURNING id_evidencia`,
            [id, ruta]
        );
        await db.query('UPDATE reporte SET evidencia = TRUE WHERE id_reporte = $1', [id]);
        res.status(201).json({ id_evidencia: fila.rows[0].id_evidencia });
        } catch (e) {
        await borrarImagen(ruta); // no dejamos el archivo huérfano si falló el registro
        throw e;
        }
    } catch (error) {
        console.error('Error al subir evidencia:', error.message);
        res.status(500).json({ error: 'No se pudo subir la evidencia' });
    }
}

module.exports = { subirEvidencia };