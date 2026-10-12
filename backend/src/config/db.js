const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
    console.error('Error inesperado en la conexión a PostgreSQL:', err);
});

module.exports = {
    // Consulta simple: el pool elige una conexión libre y la devuelve solo
    query: (texto, parametros) => pool.query(texto, parametros),

    // NUEVO: pide UNA conexión reservada, necesaria para transacciones.
    // Quien la use debe llamar a cliente.release() al terminar
    getClient: () => pool.connect(),
};