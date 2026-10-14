import React, { useMemo, useRef } from 'react';
import {
    View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colores } from '../theme';
import MapaLeaflet from '../components/MapaLeaflet';
import { construirHtmlMapa } from '../utils/htmlMapa';
import { agruparZonas } from '../utils/zonas';

// Pasos del flujo del sistema (tomados del diagrama de secuencia del proyecto)
const PASOS = [
    { icono: 'create-outline',   titulo: 'Reportar',  texto: 'El estudiante describe el riesgo y su ubicación' },
    { icono: 'sparkles-outline', titulo: 'Analizar',  texto: 'La IA sugiere categoría y severidad' },
    { icono: 'flag-outline',     titulo: 'Priorizar', texto: 'Se ordena según el nivel de riesgo' },
    { icono: 'construct-outline', titulo: 'Gestionar', texto: 'El administrador asigna y da seguimiento' },
];

// Tarjetas de la sección "Capacidades". "pronto" muestra la etiqueta "Próximamente"
const CAPACIDADES = [
    {
        icono: 'alert-circle', color: colores.primario, titulo: 'Reporte rápido',
        texto: 'Registra incidentes con ubicación GPS o por bloque, en pocos toques desde el celular o el navegador.',
    },
    {
        icono: 'map', color: colores.verde, titulo: 'Mapa de riesgos',
        texto: 'Visualiza sobre un mapa real los incidentes de la universidad, con marcadores por nivel de prioridad.',
    },
    {
        icono: 'sparkles', color: '#1A4FA0', titulo: 'Clasificación con IA', pronto: true,
        texto: 'Analiza la descripción del reporte para sugerir su categoría, severidad y prioridad de atención.',
    },
];

// Ítems de la sección oscura "Seguridad"
const SEGURIDAD = [
    { icono: 'location-outline', titulo: 'Marcadores por prioridad',
        texto: 'Cada reporte con GPS se ubica en el mapa con un color según su nivel de riesgo.' },
    { icono: 'flame-outline', titulo: 'Zonas de concentración',
        texto: 'Detecta áreas donde se acumulan incidentes cercanos para priorizar la prevención.' },
    { icono: 'time-outline', titulo: 'Historial y seguimiento',
        texto: 'Cada cambio de estado queda registrado, así el estudiante conoce el avance de su reporte.' },
];

// Reportes de EJEMPLO para el mapa de la landing. No vienen del backend:
// la página es pública y no debe mostrar datos reales de usuarios.
// Cambia las coordenadas por las de tu campus.
const REPORTES_EJEMPLO = [
  // Tres reportes muy juntos: formarán una zona de concentración (mancha roja)
    { id: 1, titulo: 'Cable expuesto en pasillo', prioridad: 'Crítico', estado: 'En proceso', bloque: 'Bloque B', lat: 4.59810, lng: -74.07580 },
    { id: 2, titulo: 'Fuga de agua en baños',     prioridad: 'Alto',    estado: 'Pendiente',  bloque: 'Bloque B', lat: 4.59820, lng: -74.07570 },
    { id: 3, titulo: 'Piso mojado en pasillo',    prioridad: 'Medio',   estado: 'Pendiente',  bloque: 'Bloque B', lat: 4.59805, lng: -74.07590 },
    // Reportes aislados en otras zonas
    { id: 4, titulo: 'Lámpara dañada',            prioridad: 'Alto',    estado: 'En revisión', bloque: 'Cafetería', lat: 4.59950, lng: -74.07450 },
    { id: 5, titulo: 'Basura acumulada',          prioridad: 'Bajo',    estado: 'Resuelto',    bloque: 'Cafetería', lat: 4.59700, lng: -74.07700 },
    { id: 6, titulo: 'Rampa obstruida',           prioridad: 'Medio',   estado: 'Pendiente',   bloque: 'Biblioteca Central', lat: 4.59880, lng: -74.07720 },
    { id: 7, titulo: 'Puerta en mal estado',      prioridad: 'Bajo',    estado: 'Resuelto',    bloque: 'Gimnasio', lat: 4.59650, lng: -74.07490 },
];

// Se calcula UNA sola vez al cargar el archivo (no en cada render): el HTML del mapa
// no cambia, y regenerarlo reiniciaría el mapa cada vez que React vuelve a dibujar la pantalla
const HTML_MAPA_DEMO = construirHtmlMapa({
    puntos: REPORTES_EJEMPLO,
    zonas: agruparZonas(REPORTES_EJEMPLO),
    demo: true,
});

// El mapa exige esta función, pero en la landing los popups no tienen botón
const sinAccion = () => {};

export default function LandingScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const esAncho = width >= 900;

    // Referencia al ScrollView para poder desplazarlo desde los enlaces del encabezado
    const scrollRef = useRef(null);
    // Guarda la posición vertical (y) de cada sección; se llena con onLayout
    const posiciones = useRef({});

    const guardarY = (nombre) => (e) => { posiciones.current[nombre] = e.nativeEvent.layout.y; };
    const irA = (nombre) => {
        scrollRef.current?.scrollTo({ y: posiciones.current[nombre] || 0, animated: true });
    };

    return (
        <View style={estilos.raiz}>
        {/* ---------- Encabezado fijo (queda fuera del ScrollView) ---------- */}
        <View style={[estilos.barra, { paddingTop: insets.top + 10 }]}>
            <View style={estilos.barraFila}>
            <TouchableOpacity style={estilos.marcaFila} onPress={() => irA('inicio')}>
                <Image source={require('../../assets/logo.png')} style={estilos.logo} resizeMode="contain" />
                <Text style={estilos.marca}>SafeCampus IA</Text>
            </TouchableOpacity>

            {/* Enlaces: solo en pantallas anchas */}
            {esAncho && (
                <View style={estilos.enlaces}>
                <TouchableOpacity onPress={() => irA('inicio')}><Text style={[estilos.enlace, estilos.enlaceActivo]}>Inicio</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => irA('capacidades')}><Text style={estilos.enlace}>Capacidades</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => irA('seguridad')}><Text style={estilos.enlace}>Seguridad</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => irA('soporte')}><Text style={estilos.enlace}>Soporte</Text></TouchableOpacity>
                </View>
            )}

            <TouchableOpacity style={estilos.botonIngresar} onPress={() => navigation.navigate('Login')}>
                <Text style={estilos.botonIngresarTexto}>Ingresar</Text>
            </TouchableOpacity>
            </View>
        </View>

        <ScrollView ref={scrollRef}>
            {/* ---------- HERO ---------- */}
            <View style={estilos.hero} onLayout={guardarY('inicio')}>
            <View style={[estilos.heroInterior, esAncho && { flexDirection: 'row', alignItems: 'center', gap: 40 }]}>
                <View style={esAncho ? { flex: 1 } : null}>
                <View style={estilos.etiquetaPro}>
                    <Ionicons name="shield-checkmark" size={14} color={colores.primario} />
                    <Text style={estilos.etiquetaProTexto}>SEGURIDAD PROACTIVA</Text>
                </View>
                <Text style={[estilos.heroTitulo, !esAncho && { fontSize: 34, lineHeight: 40 }]}>
                    Protección Inteligente para tu Campus
                </Text>
                <Text style={estilos.heroTexto}>
                    Plataforma para reportar, clasificar y gestionar riesgos en tu universidad,
                    con apoyo de inteligencia artificial y seguimiento en tiempo real.
                </Text>

                <View style={estilos.heroBotones}>
                    <TouchableOpacity style={estilos.botonNegro} onPress={() => navigation.navigate('Login')}>
                        <Text style={estilos.botonNegroTexto}>Empezar ahora</Text>
                        <Ionicons name="arrow-forward" size={18} color={colores.blanco} />
                    </TouchableOpacity>
                </View>
                </View>

                {/* Tarjeta con el flujo del sistema */}
                <View style={[estilos.tarjetaFlujo, esAncho ? { flex: 1 } : { marginTop: 32 }]}>
                <Text style={estilos.flujoTitulo}>Así funciona SafeCampus IA</Text>
                {PASOS.map((p, i) => (
                    <View key={p.titulo} style={estilos.paso}>
                    <View style={estilos.pasoIcono}>
                        <Ionicons name={p.icono} size={20} color={colores.primario} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={estilos.pasoTitulo}>{i + 1}. {p.titulo}</Text>
                        <Text style={estilos.pasoTexto}>{p.texto}</Text>
                    </View>
                    </View>
                ))}
                </View>
            </View>
            </View>

            {/* ---------- CAPACIDADES ---------- */}
            <View style={estilos.seccion} onLayout={guardarY('capacidades')}>
            <Text style={estilos.seccionTitulo}>Capacidades del Sistema</Text>
            <Text style={estilos.seccionSub}>
                Todo lo necesario para pasar de un reporte aislado a decisiones preventivas.
            </Text>

            <View style={[estilos.tarjetasFila, esAncho && { flexDirection: 'row' }]}>
                {CAPACIDADES.map((c) => (
                <View key={c.titulo} style={[estilos.tarjetaCap, esAncho && { flex: 1 }]}>
                    <View style={[estilos.capIcono, { backgroundColor: c.color }]}>
                    <Ionicons name={c.icono} size={22} color={colores.blanco} />
                    </View>
                    <View style={estilos.capTituloFila}>
                    <Text style={estilos.capTitulo}>{c.titulo}</Text>
                    {c.pronto && (
                        <View style={estilos.pronto}><Text style={estilos.prontoTexto}>Próximamente</Text></View>
                    )}
                    </View>
                    <Text style={estilos.capTexto}>{c.texto}</Text>
                </View>
                ))}
            </View>
            </View>

            {/* ---------- SEGURIDAD (sección oscura) ---------- */}
            <View style={estilos.oscura} onLayout={guardarY('seguridad')}>
            <View style={[estilos.oscuraInterior, esAncho && { flexDirection: 'row', gap: 40 }]}>
                <View style={esAncho ? { flex: 1 } : null}>
                <Text style={estilos.oscuraTitulo}>Visibilidad completa del campus</Text>
                <Text style={estilos.oscuraTexto}>
                    El panel del administrador reúne todos los reportes en un mapa para identificar
                    dónde están los riesgos y actuar a tiempo.
                </Text>
                {SEGURIDAD.map((s) => (
                    <View key={s.titulo} style={estilos.itemOscuro}>
                    <Ionicons name={s.icono} size={20} color={colores.acento} />
                    <View style={{ flex: 1 }}>
                        <Text style={estilos.itemOscuroTitulo}>{s.titulo}</Text>
                        <Text style={estilos.itemOscuroTexto}>{s.texto}</Text>
                    </View>
                    </View>
                ))}
                </View>

                {/* Mapa real (OpenStreetMap) con reportes de ejemplo */}
                <View style={esAncho ? { flex: 1 } : { marginTop: 24 }}>
                    <View style={estilos.mapaReal}>
                        <MapaLeaflet html={HTML_MAPA_DEMO} altura={esAncho ? 400 : 300} onSeleccionar={sinAccion} />
                    </View>
                    <Text style={estilos.notaMapa}>
                        Mapa con datos de ejemplo. Toca un marcador para ver cómo se muestra un reporte.
                    </Text>
                </View>
            </View>
            </View>

            {/* ---------- SOPORTE / pie ---------- */}
            {/* ---------- ¿Listo para reportar? (llamado a la acción) ---------- */}
            <View style={estilos.cta}>
            <Text style={estilos.soporteTitulo}>¿Listo para reportar?</Text>
            <Text style={estilos.seccionSub}>
                Crea tu cuenta con tu correo institucional y empieza a cuidar tu campus.
            </Text>
            <View style={[estilos.heroBotones, { justifyContent: 'center' }]}>
                <TouchableOpacity style={estilos.botonNegro} onPress={() => navigation.navigate('Registro')}>
                <Text style={estilos.botonNegroTexto}>Crear cuenta</Text>
                </TouchableOpacity>
                <TouchableOpacity style={estilos.botonClaro} onPress={() => navigation.navigate('Login')}>
                <Text style={estilos.botonClaroTexto}>Ya tengo cuenta</Text>
                </TouchableOpacity>
            </View>
            </View>

            {/* ---------- FOOTER (el enlace "Soporte" del encabezado baja hasta aquí) ---------- */}
            <View style={estilos.footer} onLayout={guardarY('soporte')}>
            <View style={[estilos.footerInterior, esAncho && { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <View style={estilos.footerMarca}>
                <Image source={require('../../assets/logo.png')} style={estilos.logoFooter} resizeMode="contain" />
                <View>
                    <Text style={estilos.footerNombre}>SafeCampus IA</Text>
                    <Text style={estilos.footerSub}>Gestión y prevención de riesgos universitarios</Text>
                </View>
                </View>

                <View style={esAncho ? { alignItems: 'flex-end' } : { marginTop: 16 }}>
                <Text style={estilos.footerSoporte}>Soporte: soporte@safecampus.edu</Text>
                <Text style={estilos.footerCopy}>© 2026 SafeCampus IA. Todos los derechos reservados.</Text>
                </View>
            </View>
        </View>
        </ScrollView>
        </View>
    );
}

const estilos = StyleSheet.create({
    raiz: { flex: 1, backgroundColor: colores.fondo },

    // ----- Encabezado -----
    barra: { backgroundColor: colores.blanco, paddingBottom: 10, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colores.borde },
    barraFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1100, width: '100%', alignSelf: 'center' },
    marcaFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logo: { width: 34, height: 34 },
    marca: { fontSize: 18, fontWeight: '800', color: colores.texto },
    enlaces: { flexDirection: 'row', gap: 28 },
    enlace: { color: colores.textoSuave, fontWeight: '600', fontSize: 14 },
    enlaceActivo: { color: colores.primario },
    botonIngresar: { backgroundColor: colores.oscuro, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8 },
    botonIngresarTexto: { color: colores.blanco, fontWeight: '700', fontSize: 14 },

    // ----- Hero -----
    hero: { backgroundColor: '#EEF2FF', paddingVertical: 56, paddingHorizontal: 20 },
    heroInterior: { maxWidth: 1100, width: '100%', alignSelf: 'center' },
    etiquetaPro: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
    etiquetaProTexto: { color: colores.primario, fontWeight: '800', fontSize: 12, letterSpacing: 1 },
    heroTitulo: { fontSize: 46, lineHeight: 52, fontWeight: '800', color: colores.texto },
    heroTexto: { fontSize: 17, lineHeight: 26, color: colores.textoSuave, marginTop: 16, maxWidth: 520 },
    heroBotones: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24 },
    botonNegro: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#000', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 10 },
    botonNegroTexto: { color: colores.blanco, fontWeight: '700', fontSize: 15 },
    botonClaro: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colores.blanco, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: colores.borde },
    botonClaroTexto: { color: colores.texto, fontWeight: '600', fontSize: 15 },

    // Tarjeta del flujo
    tarjetaFlujo: { backgroundColor: colores.blanco, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 5 },
    flujoTitulo: { fontSize: 18, fontWeight: '800', color: colores.texto, marginBottom: 12 },
    paso: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
    pasoIcono: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FDECEF', alignItems: 'center', justifyContent: 'center' },
    pasoTitulo: { fontWeight: '700', color: colores.texto, fontSize: 15 },
    pasoTexto: { color: colores.textoSuave, fontSize: 13, marginTop: 1 },

    // ----- Capacidades -----
    seccion: { paddingVertical: 64, paddingHorizontal: 20, maxWidth: 1100, width: '100%', alignSelf: 'center' },
    seccionTitulo: { fontSize: 34, fontWeight: '800', textAlign: 'center', color: colores.texto },
    seccionSub: { textAlign: 'center', color: colores.textoSuave, fontSize: 16, marginTop: 8, lineHeight: 24 },
    tarjetasFila: { gap: 16, marginTop: 36 },
    tarjetaCap: { backgroundColor: '#E6EEFF', borderRadius: 16, padding: 24 },
    capIcono: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    capTituloFila: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 16 },
    capTitulo: { fontSize: 19, fontWeight: '800', color: colores.texto },
    capTexto: { color: colores.textoSuave, lineHeight: 22, marginTop: 8 },
    pronto: { backgroundColor: colores.blanco, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
    prontoTexto: { fontSize: 11, fontWeight: '700', color: '#1A4FA0' },

    // ----- Sección oscura -----
    oscura: { backgroundColor: '#05070D', paddingVertical: 64, paddingHorizontal: 20 },
    oscuraInterior: { maxWidth: 1100, width: '100%', alignSelf: 'center' },
    oscuraTitulo: { fontSize: 34, lineHeight: 40, fontWeight: '800', color: colores.blanco },
    oscuraTexto: { color: colores.textoPanel, fontSize: 16, lineHeight: 24, marginTop: 12, marginBottom: 20 },
    itemOscuro: { flexDirection: 'row', gap: 14, backgroundColor: '#12151F', borderRadius: 12, padding: 16, marginTop: 10 },
    itemOscuroTitulo: { color: colores.blanco, fontWeight: '700', fontSize: 15 },
    itemOscuroTexto: { color: colores.textoPanel, fontSize: 13, lineHeight: 19, marginTop: 2 },

    // Mapa real: el borde claro lo separa del fondo oscuro de la sección
    mapaReal: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#2A3550' },
    notaMapa: { color: colores.textoPanel, fontSize: 12, marginTop: 8, opacity: 0.8 },

    // ----- Llamado a la acción -----
    cta: { paddingVertical: 64, paddingHorizontal: 20, alignItems: 'center', maxWidth: 1100, width: '100%', alignSelf: 'center' },
    soporteTitulo: { fontSize: 28, fontWeight: '800', color: colores.texto, textAlign: 'center' },

    // ----- Footer -----
    footer: { backgroundColor: colores.blanco, borderTopWidth: 1, borderTopColor: colores.borde, paddingVertical: 28, paddingHorizontal: 20 },
    footerInterior: { maxWidth: 1100, width: '100%', alignSelf: 'center' },
    footerMarca: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logoFooter: { width: 36, height: 36 },
    footerNombre: { fontWeight: '800', color: colores.texto, fontSize: 16 },
    footerSub: { color: colores.textoSuave, fontSize: 12, marginTop: 1 },
    footerSoporte: { color: colores.texto, fontWeight: '600', fontSize: 14 },
    footerCopy: { color: colores.textoSuave, fontSize: 12, marginTop: 4 },

    // ----- Soporte -----
    contacto: { color: colores.texto, marginTop: 28, fontWeight: '600' },
    pie: { color: colores.textoSuave, fontSize: 12, marginTop: 8, textAlign: 'center' },
});