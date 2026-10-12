const db = require('../config/db');

// Consulta base reutilizable: une el reporte con su estado, categoría y ubicación.
// JOIN = solo filas que tienen relación; LEFT JOIN = trae el reporte aunque
// la categoría o la ubicación sean NULL (la categoría puede estar vacía hasta que la IA clasifique)
const SELECT_REPORTES = `
    SELECT r.id_reporte, r.titulo, r.descripcion, r.fecha_reporte, r.prioridad,
        e.nombre AS estado, c.nombre AS categoria,
        u.latitud, u.longitud, u.sede, u.bloque, u.piso_area,
        us.nombre AS autor
    FROM reporte r
    JOIN estado_reporte e ON e.id_estado = r.id_estado
    JOIN usuario us       ON us.id_usuario = r.id_usuario
    LEFT JOIN categoria c ON c.id_categoria = r.id_categoria
    LEFT JOIN ubicacion u ON u.id_ubicacion = r.id_ubicacion
`;

// -------------------------------------------------------
// POST /api/reportes  (RF04, RF05)
// -------------------------------------------------------
async function crearReporte(req, res) {
    let cliente; // la declaramos fuera del try para poder liberarla en "finally"
    try {
        const {
            titulo, descripcion, id_categoria,
            latitud, longitud, tipo_ubicacion,
            sede, bloque, piso_area,
        } = req.body;

        // Validaciones de campos obligatorios (RNF09)
        if (!titulo || !descripcion) {
            return res.status(400).json({ error: 'Título y descripción son obligatorios' });
        }
        if (titulo.length > 100) {
            return res.status(400).json({ error: 'El título no puede superar 100 caracteres' });
        }

        // La ubicación GPS es opcional (RNF13): si no hay coordenadas, se reporta
        // solo con sede/bloque/área en texto. Si vienen coordenadas, las validamos.
        const hayCoordenadas =
            latitud !== undefined && latitud !== null && latitud !== '' &&
            longitud !== undefined && longitud !== null && longitud !== '';

        if (hayCoordenadas) {
            const lat = Number(latitud);
            const lng = Number(longitud);
        // Latitud va de -90 a 90; longitud de -180 a 180
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({ error: 'Las coordenadas no son válidas' });
        }
    }

        // Debe haber ALGUNA referencia del lugar: coordenadas o texto
        if (!hayCoordenadas && !sede && !bloque && !piso_area) {
            return res.status(400).json({
            error: 'Indica la ubicación: coordenadas o al menos sede/bloque/área',
        });
        }

        // ---- Inicio de la transacción ----
        cliente = await db.getClient();
        await cliente.query('BEGIN');

        // 1) Guardamos la ubicación
        const ubicacion = await cliente.query(
            `INSERT INTO ubicacion (nombre, tipo, latitud, longitud, sede, bloque, piso_area)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id_ubicacion`,
            [
                bloque || sede || 'Sin nombre',                  // nombre visible de la ubicación
                hayCoordenadas ? (tipo_ubicacion || 'gps') : 'manual',
                hayCoordenadas ? Number(latitud) : null,
                hayCoordenadas ? Number(longitud) : null,
                sede || null,
                bloque || null,
                piso_area || null,
            ]
        );

        // 2) Buscamos el id del estado inicial "Pendiente"
        const estado = await cliente.query(
            "SELECT id_estado FROM estado_reporte WHERE nombre = 'Pendiente'"
        );
        const idEstado = estado.rows[0].id_estado;

        // 3) Guardamos el reporte. req.usuario.id viene del token JWT:
        //    el usuario NO puede elegir a nombre de quién reporta (seguridad)
        const reporte = await cliente.query(
            `INSERT INTO reporte (id_usuario, id_categoria, id_ubicacion, id_estado, titulo, descripcion)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_reporte, fecha_reporte`,
            [
                req.usuario.id,
                id_categoria || null,
                ubicacion.rows[0].id_ubicacion,
            idEstado,
            titulo.trim(),
            descripcion.trim(),
            ]
        );
        const idReporte = reporte.rows[0].id_reporte;

        // 4) Primera fila del historial (RF09)
        await cliente.query(
            `INSERT INTO historial_estado (id_reporte, id_estado, id_usuario, comentario)
            VALUES ($1, $2, $3, 'Reporte creado')`,
            [idReporte, idEstado, req.usuario.id]
        );

        // Si llegamos aquí, todo salió bien: confirmamos los 4 cambios juntos
        await cliente.query('COMMIT');

        res.status(201).json({
            id_reporte: idReporte,
            estado: 'Pendiente',
            fecha_reporte: reporte.rows[0].fecha_reporte,
        });
    } catch (error) {
        // Si algo falló, deshacemos TODO lo hecho dentro de la transacción
        if (cliente) await cliente.query('ROLLBACK');
        console.error('Error al crear reporte:', error.message);
        res.status(500).json({ error: 'No se pudo crear el reporte' });
    } finally {
        // "finally" se ejecuta siempre: devolvemos la conexión al pool.
        // Si no lo hacemos, el pool se agota y el servidor se congela
        if (cliente) cliente.release();
    }
}

// -------------------------------------------------------
// GET /api/reportes/mios  (RF07)
// Reportes del usuario que tiene la sesión activa
// -------------------------------------------------------
async function misReportes(req, res) {
    try {
        const resultado = await db.query(
            `${SELECT_REPORTES}
            WHERE r.id_usuario = $1
            ORDER BY r.fecha_reporte DESC`,
            [req.usuario.id]
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al listar mis reportes:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

// -------------------------------------------------------
// GET /api/reportes  (RF10, RF14) - solo administrador
// Filtros opcionales por query string: ?estado=1&prioridad=Alto&bloque=B
// -------------------------------------------------------
async function listarTodos(req, res) {
    try {
        const { estado, prioridad, categoria, sede, bloque, desde, hasta } = req.query;

        // Construimos el WHERE dinámicamente: solo agregamos las condiciones
        // de los filtros que realmente llegaron
        const condiciones = [];
        const parametros = [];

        // Cada vez que agregamos un valor, su posición en el arreglo es el número $n
        function agregar(condicion, valor) {
            parametros.push(valor);
            condiciones.push(condicion.replace('?', `$${parametros.length}`));
        }

        if (estado)    agregar('r.id_estado = ?', estado);
        if (prioridad) agregar('r.prioridad = ?', prioridad);
        if (categoria) agregar('r.id_categoria = ?', categoria);
        if (sede)      agregar('u.sede ILIKE ?', `%${sede}%`);     // ILIKE = ignora mayúsculas
        if (bloque)    agregar('u.bloque ILIKE ?', `%${bloque}%`);
        if (desde)     agregar('r.fecha_reporte >= ?', desde);
        if (hasta)     agregar("r.fecha_reporte < (?::date + INTERVAL '1 day')", hasta); // incluye todo el día "hasta"

        // Si hay condiciones las unimos con AND; si no, no hay WHERE
        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

        const resultado = await db.query(
            `${SELECT_REPORTES} ${where} ORDER BY r.fecha_reporte DESC`,
            parametros
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al listar reportes:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

// -------------------------------------------------------
// GET /api/reportes/:id
// Detalle de un reporte con su historial y análisis de IA
// -------------------------------------------------------
async function obtenerReporte(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: 'Id de reporte inválido' });
        }

        const resultado = await db.query(
            `${SELECT_REPORTES} WHERE r.id_reporte = $1`,
            [id]
        );
        const reporte = resultado.rows[0];
        if (!reporte) {
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }

        // Control de acceso (RNF04): un estudiante solo puede ver SUS reportes.
        // Necesitamos el id del dueño, que SELECT_REPORTES no trae, así que lo consultamos
        const dueno = await db.query('SELECT id_usuario FROM reporte WHERE id_reporte = $1', [id]);
        const esDueno = dueno.rows[0].id_usuario === req.usuario.id;
        if (req.usuario.rol !== 'administrador' && !esDueno) {
            // Respondemos 404 (no 403) para no revelar que ese reporte existe
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }

        // Historial de cambios de estado (RF09), del más antiguo al más reciente
        const historial = await db.query(
            `SELECT h.fecha_cambio, e.nombre AS estado, h.comentario, u.nombre AS cambiado_por
            FROM historial_estado h
            JOIN estado_reporte e ON e.id_estado = h.id_estado
            LEFT JOIN usuario u   ON u.id_usuario = h.id_usuario
            WHERE h.id_reporte = $1
            ORDER BY h.fecha_cambio ASC`,
            [id]
        );

        // Análisis de IA (aún vacío; lo llenaremos en el Paso 5). Puede no existir.
        const analisis = await db.query(
            `SELECT categoria_sugerida, prioridad_sugerida, riesgo_detectado,
            recomendaciones, origen, fecha_analisis
            FROM analisis_ia WHERE id_reporte = $1`,
            [id]
        );

        res.json({
            ...reporte,                                  // copiamos todos los campos del reporte
            historial: historial.rows,
            analisis: analisis.rows[0] || null,          // null si aún no hay análisis
        });
    } catch (error) {
        console.error('Error al obtener reporte:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

// -------------------------------------------------------
// PATCH /api/reportes/:id/estado  (RF08, RF09) - solo administrador
// Body: { "id_estado": 3, "comentario": "Electricista en camino" }
// -------------------------------------------------------
async function cambiarEstado(req, res) {
    let cliente;
    try {
        const id = Number(req.params.id);
        const { id_estado, comentario } = req.body;

        if (!Number.isInteger(id) || !Number.isInteger(Number(id_estado))) {
            return res.status(400).json({ error: 'Id de reporte o de estado inválido' });
        }

        // Verificamos que el estado exista (evita basura en la BD)
        const estado = await db.query(
            'SELECT nombre FROM estado_reporte WHERE id_estado = $1',
            [id_estado]
        );
        if (estado.rows.length === 0) {
            return res.status(400).json({ error: 'El estado indicado no existe' });
        }

        cliente = await db.getClient();
        await cliente.query('BEGIN');

        // Actualizamos el estado. rowCount = cuántas filas se modificaron;
        // si es 0, el reporte no existe
        const actualizado = await cliente.query(
            'UPDATE reporte SET id_estado = $1 WHERE id_reporte = $2',
            [id_estado, id]
        );
        if (actualizado.rowCount === 0) {
            await cliente.query('ROLLBACK');
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }

        // Registramos el cambio en el historial junto con quién lo hizo
        await cliente.query(
            `INSERT INTO historial_estado (id_reporte, id_estado, id_usuario, comentario)
            VALUES ($1, $2, $3, $4)`,
            [id, id_estado, req.usuario.id, comentario || null]
        );

        await cliente.query('COMMIT');
        res.json({ mensaje: 'Estado actualizado', estado: estado.rows[0].nombre });
    } catch (error) {
        if (cliente) await cliente.query('ROLLBACK');
        console.error('Error al cambiar estado:', error.message);
        res.status(500).json({ error: 'No se pudo actualizar el estado' });
    } finally {
        if (cliente) cliente.release();
    }
}

module.exports = { crearReporte, misReportes, listarTodos, obtenerReporte, cambiarEstado };