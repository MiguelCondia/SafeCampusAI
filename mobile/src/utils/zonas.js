// Distancia en metros entre dos puntos (fórmula de Haversine).
// No podemos usar distancia "recta" con lat/lng porque la Tierra es curva
function distanciaM(a, b) {
    const R = 6371000;            // radio de la Tierra en metros
    const rad = Math.PI / 180;    // para convertir grados a radianes
    const dLat = (b.lat - a.lat) * rad;
    const dLng = (b.lng - a.lng) * rad;
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
}

// RF13: agrupa reportes cercanos. Recibe [{ id, lat, lng, bloque }, ...]
// Algoritmo "voraz": cada punto se une al primer grupo que esté a <= radio metros;
// si no hay ninguno, crea un grupo nuevo. Es simple y suficiente para esta versión.
export function agruparZonas(puntos, radio = 60) {
    const grupos = [];

    for (const p of puntos) {
        let g = grupos.find((z) => distanciaM(z, p) <= radio);
        if (!g) {
        g = { lat: p.lat, lng: p.lng, count: 0, ids: [], bloques: {} };
        grupos.push(g);
        }
        // Recalculamos el centro del grupo como el promedio de sus puntos
        g.lat = (g.lat * g.count + p.lat) / (g.count + 1);
        g.lng = (g.lng * g.count + p.lng) / (g.count + 1);
        g.count += 1;
        g.ids.push(p.id);
        if (p.bloque) g.bloques[p.bloque] = (g.bloques[p.bloque] || 0) + 1;
    }

    return grupos
        .map((g) => {
        // Nombre de la zona = el bloque que más se repite dentro del grupo
        const top = Object.entries(g.bloques).sort((a, b) => b[1] - a[1])[0];
        return { lat: g.lat, lng: g.lng, count: g.count, ids: g.ids, nombre: top ? top[0] : 'Zona sin nombre' };
        })
        .filter((z) => z.count >= 2)          // un reporte solo no es una "concentración"
        .sort((a, b) => b.count - a.count);   // las zonas más críticas primero
}