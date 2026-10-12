// Importamos Express: el framework que nos permite crear el servidor y las rutas de la API
const express = require('express');

// Importamos CORS: sin esto, la app móvil/web sería bloqueada por el navegador
// al intentar llamar a nuestra API desde otro origen (otro puerto o dominio)
const cors = require('cors');

// Creamos la aplicación Express. "app" es el objeto donde configuramos todo
const app = express();

// Middleware: es código que se ejecuta ANTES de llegar a cada ruta.
// cors() permite peticiones desde otros orígenes (nuestra app Expo)
app.use(cors());

// express.json() convierte el cuerpo (body) de las peticiones de texto JSON
// a un objeto de JavaScript, accesible como req.body
app.use(express.json());

// Ruta de prueba ("health check"): sirve para verificar que el servidor está vivo.
// req = lo que llega del cliente, res = lo que respondemos
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', proyecto: 'SafeCampus AI' });
});

// Exportamos "app" para usarla desde server.js.
// Separamos app de server para mantener el código modular (RNF08)
// y poder probar la app sin necesidad de abrir un puerto
module.exports = app;