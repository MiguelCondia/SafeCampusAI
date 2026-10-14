// Construye la página HTML que contiene el mapa Leaflet.
// Recibe los puntos (reportes con GPS) y las zonas ya calculadas.
export function construirHtmlMapa({ puntos, zonas }) {
    // Pasamos los datos como JSON. Reemplazar "<" evita que un título con
    // "</script>" rompa la página (seguridad básica contra inyección)
    const datos = JSON.stringify({ puntos, zonas }).replace(/</g, '\\u003c');

    return `<!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
    <style>
        html, body, #mapa { height: 100%; margin: 0; font-family: system-ui, sans-serif; }
        .pop-titulo { font-weight: 700; margin-bottom: 2px; }
        .pop-suave { color: #5B6478; font-size: 12px; margin-bottom: 6px; }
        .pop-boton { background: #0B1530; color: #fff; border: 0; border-radius: 6px;
                    padding: 6px 10px; cursor: pointer; font-weight: 600; }
    </style>
    </head>
    <body>
    <div id="mapa"></div>
    <script>
        var DATOS = ${datos};

        // Colores por prioridad (los mismos que las insignias de la app)
        var COLORES = { 'Crítico': '#E11D48', 'Alto': '#EA580C', 'Medio': '#CA8A04',
                        'Bajo': '#0F9D6B', 'Sin clasificar': '#7A8299' };

        // Escapa texto para meterlo en HTML sin que se interprete como código
        function esc(t) {
        return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
        }

        // Envía un mensaje a la app: en celular por ReactNativeWebView, en web al padre del iframe
        function enviar(msg) {
        var texto = JSON.stringify(msg);
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(texto);
        else window.parent.postMessage(texto, '*');
        }
        // Los botones de los popups llaman a esta función global
        function abrirReporte(id) { enviar({ tipo: 'abrir', id: id }); }

        // Mapa centrado por defecto en Bogotá; luego se ajusta a los reportes
        var mapa = L.map('mapa').setView([4.6097, -74.0817], 12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
        }).addTo(mapa);

        // 1) Zonas de concentración (se dibujan primero para quedar DEBAJO de los marcadores).
        //    El radio crece con la cantidad de reportes. interactive:false = no tapan los clics
        DATOS.zonas.forEach(function (z) {
        L.circle([z.lat, z.lng], {
            radius: 40 + z.count * 20, color: '#E11D48', weight: 1,
            fillColor: '#E11D48', fillOpacity: 0.18, interactive: false
        }).addTo(mapa).bindTooltip(esc(z.nombre) + ': ' + z.count + ' reportes', { permanent: false });
        });

        // 2) Marcadores: círculos de color con borde blanco
        var limites = [];
        DATOS.puntos.forEach(function (p) {
        var color = COLORES[p.prioridad] || COLORES['Sin clasificar'];
        var icono = L.divIcon({
            className: '',
            html: '<div style="width:22px;height:22px;border-radius:50%;background:' + color +
                ';border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.4)"></div>',
            iconSize: [22, 22], iconAnchor: [11, 11]
        });
        var popup =
            '<div class="pop-titulo">' + esc(p.titulo) + '</div>' +
            '<div class="pop-suave">' + esc(p.prioridad || 'Sin clasificar') + ' · ' + esc(p.estado) +
            (p.bloque ? ' · ' + esc(p.bloque) : '') + '</div>' +
            '<button class="pop-boton" onclick="abrirReporte(' + Number(p.id) + ')">Ver detalle</button>';

        L.marker([p.lat, p.lng], { icon: icono }).addTo(mapa).bindPopup(popup);
        limites.push([p.lat, p.lng]);
        });

        // Ajustamos el zoom para que se vean todos los reportes a la vez
        if (limites.length === 1) mapa.setView(limites[0], 17);
        else if (limites.length > 1) mapa.fitBounds(limites, { padding: [40, 40], maxZoom: 18 });
    </script>
    </body>
    </html>`;
}