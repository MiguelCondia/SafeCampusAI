require('dotenv').config();

(async () => {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=100', {
        headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
    });
    const datos = await r.json();
    if (!r.ok) return console.log('Error', r.status, datos);

    // Solo los que sirven para generar texto (generateContent)
    datos.models
        .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
        .forEach((m) => console.log(m.name.replace('models/', ''), '-', m.displayName));
})();