import React, { useEffect } from 'react';

// En web, el HTML se muestra dentro de un iframe.
// "srcDoc" le entrega el HTML directamente, sin necesidad de un archivo aparte
export default function MapaLeaflet({ html, altura, onSeleccionar }) {
    useEffect(() => {
        // El iframe nos avisa con postMessage cuando se toca "Ver detalle"
        function recibir(evento) {
        try {
            const msg = typeof evento.data === 'string' ? JSON.parse(evento.data) : evento.data;
            if (msg && msg.tipo === 'abrir') onSeleccionar(msg.id);
        } catch (e) {} // ignoramos mensajes ajenos (ej: de extensiones del navegador)
        }
        window.addEventListener('message', recibir);
        return () => window.removeEventListener('message', recibir); // limpieza al salir
    }, [onSeleccionar]);

    // React Native Web permite crear elementos HTML reales con createElement
    return React.createElement('iframe', {
        srcDoc: html,
        title: 'Mapa de riesgos',
        style: { width: '100%', height: altura, border: 0, borderRadius: 14 },
    });
}