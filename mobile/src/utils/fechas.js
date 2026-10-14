// Fecha completa: "13 oct 2026, 8:24 a. m."
// Se usa en el detalle del reporte y en su historial
export function formatearFecha(iso) {
    return new Date(iso).toLocaleString('es-CO', {
        day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
}

// Fecha relativa: "Hoy, 08:24" / "Ayer, 16:10" / "22 oct"
// Se usa en las tarjetas, donde el espacio es poco y importa saber qué tan reciente es
export function fechaRelativa(iso) {
    const fecha = new Date(iso);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1); // restamos un día a la fecha de hoy

    const hora = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    // toDateString() devuelve solo el día ("Tue Oct 13 2026"), sin la hora,
    // así que sirve para comparar si dos fechas caen en el mismo día
    if (fecha.toDateString() === hoy.toDateString()) return `Hoy, ${hora}`;
    if (fecha.toDateString() === ayer.toDateString()) return `Ayer, ${hora}`;

    return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}