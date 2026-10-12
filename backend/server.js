// Carga las variables del archivo .env (PORT, DATABASE_URL, JWT_SECRET...)
// y las deja disponibles en process.env. Debe ejecutarse lo primero
require('dotenv').config();

// Importamos la aplicación Express que configuramos en app.js
const app = require('./src/app');

// Usamos el puerto definido en .env; si no existe, usamos 3000 por defecto
const PORT = process.env.PORT || 3000;

// Ponemos el servidor a "escuchar" peticiones en ese puerto.
// El callback se ejecuta una vez que el servidor arrancó correctamente
app.listen(PORT, () => {
    console.log(`Servidor SafeCampus AI corriendo en http://localhost:${PORT}`);
});