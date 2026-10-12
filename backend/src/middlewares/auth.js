const jwt = require('jsonwebtoken');

// Middleware 1: verifica que la petición traiga un token válido (RNF03)
function verificarToken(req, res, next) {
    // El cliente debe enviar el header:  Authorization: Bearer <token>
    const cabecera = req.headers.authorization;

    if (!cabecera || !cabecera.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No autenticado: falta el token' });
    }

    // Quitamos "Bearer " (7 caracteres) y nos quedamos con el token
    const token = cabecera.slice(7);

    try {
        // jwt.verify comprueba la firma y la expiración.
        // Si el token fue alterado o venció, lanza un error.
        const datos = jwt.verify(token, process.env.JWT_SECRET);

        // Guardamos { id, rol } en req.usuario para que lo usen los siguientes pasos
        req.usuario = datos;

        // next() = "todo bien, continúa al siguiente middleware o al controlador"
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

// Middleware 2: restringe el acceso por rol (RNF04).
// Es una "fábrica": recibe los roles permitidos y devuelve el middleware.
// Uso:  router.get('/ruta', verificarToken, permitirRoles('administrador'), controlador)
function permitirRoles(...rolesPermitidos) {
    return (req, res, next) => {
        // Este middleware siempre va DESPUÉS de verificarToken, por eso req.usuario ya existe
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            // 403 = "Prohibido": sabemos quién eres, pero no tienes permiso
            return res.status(403).json({ error: 'No tienes permiso para esta acción' });
        }
        next();
    };
}

module.exports = { verificarToken, permitirRoles };