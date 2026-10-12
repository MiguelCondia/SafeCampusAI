// Importamos solo la clase Pool del paquete "pg".
// Un Pool mantiene varias conexiones abiertas y las reutiliza,
// lo cual es mucho más eficiente que abrir una conexión nueva en cada consulta
const { Pool } = require('pg');

// Creamos el pool usando la URL de conexión definida en el archivo .env
// (postgresql://usuario:contraseña@host:puerto/basededatos)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Si una conexión inactiva falla (por ejemplo, se cae la BD),
// lo registramos en consola en vez de dejar que la app se cierre (RNF12)
pool.on('error', (err) => {
    console.error('Error inesperado en la conexión a PostgreSQL:', err);
});

// Exportamos un método "query" para usarlo en todo el proyecto así:
//   const db = require('../config/db');
//   const resultado = await db.query('SELECT * FROM usuario WHERE id_usuario = $1', [5]);
// Los $1, $2... son parámetros: protegen contra inyección SQL (RNF03)
module.exports = {
    query: (texto, parametros) => pool.query(texto, parametros),
};