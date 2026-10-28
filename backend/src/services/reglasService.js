// Respaldo por palabras clave (RNF12): se usa cuando Gemini falla o no hay API key.
// Cada categoría tiene palabras que la delatan y un impacto/probabilidad típicos.
const REGLAS = [
    { categoria: 'Emergencia médica', palabras: ['desmay', 'herid', 'sangr', 'convuls', 'inconsciente', 'lesion', 'accidente'], prob: 'Alta', imp: 'Alto' },
    { categoria: 'Eléctrico', palabras: ['cable', 'chispa', 'corto', 'electric', 'tomacorriente', 'voltaje', 'descarga'], prob: 'Alta', imp: 'Alto' },
    { categoria: 'Hidráulico', palabras: ['fuga', 'tuberia', 'inundac', 'goter', 'agua', 'piso mojado', 'humedad'], prob: 'Media', imp: 'Moderado' },
    { categoria: 'Seguridad física', palabras: ['robo', 'hurto', 'sospechos', 'intruso', 'ajena', 'agresion', 'acoso'], prob: 'Media', imp: 'Alto' },
    { categoria: 'Iluminación', palabras: ['lampara', 'luz', 'oscur', 'bombillo', 'iluminacion'], prob: 'Media', imp: 'Bajo' },
    { categoria: 'Accesibilidad', palabras: ['rampa', 'ascensor', 'discapacidad', 'obstruid', 'silla de ruedas'], prob: 'Media', imp: 'Moderado' },
    { categoria: 'Infraestructura', palabras: ['grieta', 'techo', 'pared', 'puerta', 'ventana', 'baranda', 'derrumb', 'escalera'], prob: 'Media', imp: 'Moderado' },
    { categoria: 'Ambiental', palabras: ['gas', 'olor', 'humo', 'quimic', 'plaga', 'contamin'], prob: 'Media', imp: 'Alto' },
    { categoria: 'Limpieza', palabras: ['basura', 'sucio', 'aseo', 'residuo', 'desecho'], prob: 'Alta', imp: 'Bajo' },
];

// Quita tildes y pasa a minúsculas para comparar sin problemas de acentos
const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function clasificarPorReglas(titulo, descripcion) {
    const texto = normalizar(`${titulo} ${descripcion}`);
    // Elegimos la categoría con más coincidencias
    let mejor = null, max = 0;
    for (const r of REGLAS) {
        const aciertos = r.palabras.filter((p) => texto.includes(p)).length;
        if (aciertos > max) { max = aciertos; mejor = r; }
    }
    if (!mejor) {
        return { categoria: 'Otro', tipo_riesgo: 'No identificado', probabilidad: 'Baja', impacto: 'Bajo',
                recomendacion: 'Un administrador debe revisar el reporte.', confianza: 0.2, origen: 'reglas' };
    }
    return {
        categoria: mejor.categoria, tipo_riesgo: `Posible riesgo de tipo ${mejor.categoria.toLowerCase()}`,
        probabilidad: mejor.prob, impacto: mejor.imp,
        recomendacion: 'Revisar el reporte y asignar al área responsable.',
        confianza: Math.min(0.4 + max * 0.1, 0.7), origen: 'reglas',
    };
}

module.exports = { clasificarPorReglas };