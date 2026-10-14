import { API_URL } from '../config';
import { obtener } from './storage';

// Función única para hablar con el backend. Todas las pantallas la usarán, así:
//   const reportes = await api('/reportes/mios');
//   await api('/reportes', { metodo: 'POST', cuerpo: { titulo: '...' } });
export async function api(ruta, { metodo = 'GET', cuerpo } = {}) {
    // Si hay sesión iniciada, adjuntamos el token en el header Authorization
    const token = await obtener('token');

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    let respuesta;
    try {
        respuesta = await fetch(`${API_URL}${ruta}`, {
        method: metodo,
        headers,
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
        });
    } catch (e) {
        // fetch solo lanza error cuando NO hay conexión con el servidor (RNF12).
        // Damos un mensaje entendible en vez de dejar que la app se rompa.
        throw new Error('No se pudo conectar con el servidor. Revisa tu conexión.');
    }

    // Intentamos leer el JSON; si la respuesta viene vacía, dejamos datos en null
    let datos = null;
    try {
        datos = await respuesta.json();
    } catch (e) {}

    // Si el backend respondió con error (400, 401, 403...), lanzamos un Error
    // con el mensaje que envió el backend ({ error: "..." })
    if (!respuesta.ok) {
        const error = new Error((datos && datos.error) || 'Ocurrió un error inesperado');
        error.status = respuesta.status; // guardamos el código por si la pantalla lo necesita
        throw error;
    }

    return datos;
}