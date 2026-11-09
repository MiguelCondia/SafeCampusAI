const { Pool } = require('pg');

// DB_SSL=true activa la conexión cifrada, obligatoria en Supabase.
// En una base local (sin SSL), se deja DB_SSL vacío o en false.
const usarSSL = process.env.DB_SSL === 'true';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // rejectUnauthorized:false cifra el tráfico pero no verifica la identidad del servidor.
    // Es aceptable en un proyecto académico; en producción se debe usar el certificado
    // (CA) que Supabase ofrece en Database > Settings y pasarlo en la opción "ca".
    ssl: usarSSL ? { rejectUnauthorized: false } : false,
    max: 10,                        // máximo de conexiones abiertas
    idleTimeoutMillis: 30000,       // cierra conexiones inactivas tras 30 s
    connectionTimeoutMillis: 10000, // si no conecta en 10 s, falla en vez de quedarse colgado
});

// Un error en una conexión inactiva se registra y no cierra la aplicación (RNF12)
pool.on('error', (err) => {
    console.error('Error inesperado en la conexión a PostgreSQL:', err);
});

module.exports = {
    query: (texto, parametros) => pool.query(texto, parametros),
    getClient: () => pool.connect(), // conexión reservada para transacciones
};