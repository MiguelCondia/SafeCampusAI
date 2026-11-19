require('dotenv').config();

const modelo = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
console.log('Modelo:', modelo, '| Clave definida:', Boolean(process.env.GEMINI_API_KEY));

(async () => {
  const inicio = Date.now();
  const control = new AbortController();
  const t = setTimeout(() => control.abort(), 60000); // esperamos hasta 60 s para medir
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
      {
        method: 'POST',
        signal: control.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Responde solo con la palabra: listo' }] }],
        }),
      }
    );
    console.log('HTTP', r.status, `en ${((Date.now() - inicio) / 1000).toFixed(1)} s`);
    console.log((await r.text()).slice(0, 600));
  } catch (e) {
    console.log('FALLÓ tras', ((Date.now() - inicio) / 1000).toFixed(1), 's:', e.name, '-', e.message, '| causa:', e.cause && (e.cause.code || e.cause.message));
  } finally {
    clearTimeout(t);
  }
})();