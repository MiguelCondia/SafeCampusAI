require('dotenv').config();

// Modelos de tu lista a probar. Agrega o quita los que quieras.
const MODELOS = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];

(async () => {
  for (const modelo of MODELOS) {
    const inicio = Date.now();
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
        {
          method: 'POST',
          signal: AbortSignal.timeout(30000), // espera máxima: 30 s
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'Responde solo con la palabra: listo' }] }] }),
        }
      );
      const seg = ((Date.now() - inicio) / 1000).toFixed(1);
      const cuerpo = await r.json().catch(() => ({}));
      console.log(`${modelo.padEnd(24)} HTTP ${r.status}  ${seg} s  ${r.ok ? 'OK' : (cuerpo.error?.status || '')}`);
    } catch (e) {
      console.log(`${modelo.padEnd(24)} FALLÓ: ${e.name}`);
    }
  }
})();