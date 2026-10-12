// Cargamos el .env (necesitamos DATABASE_URL). La ruta es relativa a este archivo.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt = require('bcrypt');
const db = require('../src/config/db');

async function crearAdmin() {
    // Datos del administrador.
    const nombre = 'Administrador SafeCampus';
    const correo = 'mcondia@ucundinamarca.edu.co';
    const contrasena = 'Miguelito_2005';

    // Ciframos la contraseña igual que en el registro
    const hash = await bcrypt.hash(contrasena, 10);

    // ON CONFLICT: si el correo ya existe, no falla ni duplica; solo actualiza
    // el rol y la contraseña. Así puedes ejecutar el script varias veces sin problema.
    await db.query(
        `INSERT INTO usuario (nombre, correo, contrasena, rol)
        VALUES ($1, $2, $3, 'administrador')
        ON CONFLICT (correo) DO UPDATE SET rol = 'administrador', contrasena = $3`,
        [nombre, correo, hash]
    );

    console.log(`Administrador listo: ${correo} / ${contrasena}`);
    process.exit(0); // cerramos el proceso (el pool de conexiones lo mantendría abierto)
}

// Si algo falla, lo mostramos y salimos con código de error
crearAdmin().catch((err) => {
    console.error('Error creando admin:', err.message);
    process.exit(1);
});