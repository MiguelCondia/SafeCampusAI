const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Cliente con la clave de servidor: tiene acceso total, por eso solo se usa aquí (backend).
// persistSession:false porque en un servidor no hay sesión de usuario que guardar.
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
});
const BUCKET = process.env.SUPABASE_BUCKET || 'evidencias';

// Sube una imagen JPEG y devuelve su ruta dentro del bucket.
// El nombre lo genera el servidor: carpeta por reporte + nombre aleatorio.
async function subirImagen(idReporte, buffer) {
    const ruta = `${idReporte}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.jpg`;
    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(ruta, buffer, { contentType: 'image/jpeg', upsert: false });
    if (error) throw new Error(`Storage: ${error.message}`);
    return ruta;
}

// URL temporal de lectura (1 hora). El bucket es privado: sin este enlace no se puede ver la foto.
async function firmarUrl(ruta, segundos = 3600) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(ruta, segundos);
    if (error) return null; // si falla, el detalle se muestra igual, solo sin esa foto
    return data.signedUrl;
}

// Borra un archivo (se usa si falla el registro en la base de datos, para no dejar huérfanos)
async function borrarImagen(ruta) {
    await supabase.storage.from(BUCKET).remove([ruta]);
}

module.exports = { subirImagen, firmarUrl, borrarImagen };