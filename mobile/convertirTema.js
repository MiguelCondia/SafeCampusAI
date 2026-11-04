const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'src');
const archivos = [];
for (const carpeta of ['screens', 'components']) {
    for (const f of fs.readdirSync(path.join(src, carpeta))) {
        if (f.endsWith('.js')) archivos.push(path.join(src, carpeta, f));
    }
}
archivos.push(path.join(src, 'navigation', 'AppNavigator.js'));

// Archivos que no se tocan (ya están listos o no tienen estilos)
const OMITIR = ['BotonTema.js', 'Insignia.js', 'TarjetaReporte.js', 'conLayoutAdmin.js',
    'MapaLeaflet.web.js', 'MapaLeaflet.native.js'];

// Colores fijos de tu diseño -> colores del tema
const REEMPLAZOS = [
    ["backgroundColor: colores.blanco", "backgroundColor: colores.superficie"],
    ["backgroundColor: '#000'", "backgroundColor: colores.botonNegro"],
    ["'#E8F0FE'", "colores.infoFondo"], ["'#1A4FA0'", "colores.infoTexto"],
    ["'#FFF4E0'", "colores.avisoFondo"], ["'#B26A00'", "colores.avisoTexto"],
    ["'#E3F7EE'", "colores.okFondo"],    ["'#0F7A55'", "colores.okTexto"],
    ["'#FDECEF'", "colores.peligroFondo"],
    ["'#EEF2FF'", "colores.heroFondo"],  ["'#E6EEFF'", "colores.tarjetaAzul"],
    ["'#EEF0F6'", "colores.separador"],
    ["'#E8ECF4'", "colores.pista"],      ["'#E3E7F0'", "colores.pista"],
    ["'#ECEFF3'", "colores.neutroFondo"], ["'#5E35B1'", "colores.moradoTexto"],
    ['placeholderTextColor="#9AA2B5"', 'placeholderTextColor={colores.placeholder}'],
];

// Firma de un componente en una sola línea: "function Nombre(...) {"
const reFuncion = /^(export default |export )?function ([A-Z]\w*)\(([^)]*)\)\s*\{\s*$/;

for (const archivo of archivos) {
    const nombre = path.basename(archivo);
    if (OMITIR.includes(nombre)) continue;

    let s = fs.readFileSync(archivo, 'utf8');
    if (s.includes('useEstilos(')) { console.log('ya convertido:', nombre); continue; }

    // 1) Import: conservamos "colores" (estático) y agregamos los hooks
    s = s.replace(/import \{ colores \} from '([^']*theme)';/, "import { colores, useTema, useEstilos } from '$1';");

    // 2) Estilos como función de la paleta
    const tieneEstilos = s.includes('const estilos = StyleSheet.create(');
    s = s.replace('const estilos = StyleSheet.create(', 'const crearEstilos = (colores) => StyleSheet.create(');

    // 3) Colores fijos -> tokens
    for (const [de, a] of REEMPLAZOS) s = s.split(de).join(a);

    // 4) Cuadros pastel de prioridad -> versión translúcida del color propio
    if (nombre === 'PanelAdminScreen.js' || nombre === 'MapaRiesgosScreen.js') {
        s = s.replace(/backgroundColor: (?!colores\b)(\w+)\.fondo/g, "backgroundColor: $1.color + '26'");
    }

    // 5) Hooks al inicio de cada componente
    let componentes = 0;
    const salida = [];
    for (const linea of s.split('\n')) {
        salida.push(linea);
        if (reFuncion.test(linea)) {
        componentes++;
        salida.push('  const { colores } = useTema();');
        if (tieneEstilos) salida.push('  const estilos = useEstilos(crearEstilos);');
        }
    }
    fs.writeFileSync(archivo, salida.join('\n'));
    console.log(`convertido: ${nombre} (${componentes} componente(s))`);
}
console.log('Listo. Ahora haz los ajustes manuales de la guía.');