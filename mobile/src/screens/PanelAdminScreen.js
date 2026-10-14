import React, { useCallback, useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Insignia from '../components/Insignia';
import { fechaRelativa } from '../utils/fechas';
import { colores } from '../theme';

// Los 4 niveles del "Resumen de riesgos", con los colores del mockup (RF12)
const PRIORIDADES = [
    { nombre: 'Crítico', etiqueta: 'Críticos', color: '#E11D48', fondo: '#FDECEF' },
    { nombre: 'Alto',    etiqueta: 'Altos',    color: '#EA580C', fondo: '#FFF1E6' },
    { nombre: 'Medio',   etiqueta: 'Medios',   color: '#CA8A04', fondo: '#FEF9E1' },
    { nombre: 'Bajo',    etiqueta: 'Bajos',    color: '#0F9D6B', fondo: '#E8F8F1' },
];
const COLOR_NEUTRO = { color: '#7A8299', fondo: '#ECEFF3' };

// Una fila de gráfico de barras: nombre, barra proporcional y cantidad
function FilaBarra({ nombre, cantidad, maximo, color }) {
    // Ancho proporcional al valor más alto del grupo (si el máximo es 0, evitamos dividir entre cero)
    const ancho = maximo ? Math.round((cantidad / maximo) * 100) : 0;
    return (
        <View style={estilos.filaBarra}>
        <Text style={estilos.barraNombre} numberOfLines={1}>{nombre}</Text>
        <View style={estilos.barraFondo}>
            <View style={[estilos.barraRelleno, { width: `${ancho}%`, backgroundColor: color }]} />
        </View>
        <Text style={estilos.barraCantidad}>{cantidad}</Text>
        </View>
    );
}

// Tarjeta con título y varias filas de barras
function GraficoBarras({ titulo, datos, color }) {
    const maximo = Math.max(0, ...datos.map((d) => d.cantidad));
    return (
        <View style={estilos.panel}>
        <Text style={estilos.panelTitulo}>{titulo}</Text>
        {datos.length === 0 && <Text style={estilos.suave}>Sin datos todavía</Text>}
        {datos.map((d) => (
            <FilaBarra key={d.nombre} nombre={d.nombre} cantidad={d.cantidad} maximo={maximo} color={color} />
        ))}
        </View>
    );
}

// Una fila compacta de la lista "Reportes recientes"
function FilaReciente({ reporte, onPress }) {
    const tono = PRIORIDADES.find((p) => p.nombre === reporte.prioridad) || COLOR_NEUTRO;
    const ubicacion = [reporte.bloque, reporte.piso_area].filter(Boolean).join(' · ') || reporte.sede || 'Sin ubicación';
    return (
        <TouchableOpacity style={estilos.filaReciente} onPress={onPress}>
        {/* Cuadro de color según la prioridad del reporte */}
        <View style={[estilos.iconoReciente, { backgroundColor: tono.fondo }]}>
            <Ionicons name="alert-circle-outline" size={20} color={tono.color} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={estilos.recienteTitulo} numberOfLines={1}>{reporte.titulo}</Text>
            <Text style={estilos.suave} numberOfLines={1}>{ubicacion}</Text>
            <Text style={estilos.fecha}>{fechaRelativa(reporte.fecha_reporte)}</Text>
        </View>
        <Insignia tipo="prioridad" texto={reporte.prioridad} />
        </TouchableOpacity>
    );
}

export default function PanelAdminScreen({ navigation }) {
    const { usuario } = useAuth();
    const { width } = useWindowDimensions();
    // Hay barra lateral desde 900px, así que el contenido necesita más ancho para dos columnas
    const dosColumnas = width >= 1150;

    const [stats, setStats] = useState(null);
    const [recientes, setRecientes] = useState([]);
    const [error, setError] = useState('');

    useFocusEffect(
        useCallback(() => {
        let activo = true;
        async function cargar() {
            try {
            // Promise.all lanza las dos peticiones a la vez en lugar de una tras otra
            const [s, reportes] = await Promise.all([api('/estadisticas'), api('/reportes')]);
            if (activo) {
                setStats(s);
                setRecientes(reportes.slice(0, 5)); // los 5 más recientes
                setError('');
            }
            } catch (e) {
            if (activo) setError(e.message);
            }
        }
        cargar();
        return () => { activo = false; };
        }, [])
    );

    if (error) return <Text style={[estilos.error, { margin: 20 }]}>{error}</Text>;
    if (!stats) return <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colores.primario} />;

    // Busca la cantidad de un grupo por su nombre; 0 si no aparece
    const cantidad = (lista, nombre) => (lista.find((e) => e.nombre === nombre) || {}).cantidad || 0;
    const sinClasificar = cantidad(stats.por_prioridad, 'Sin clasificar');

    // ---- Bloque 1: las 4 tarjetas del RF11 ----
    const tarjetas = [
        { etiqueta: 'Total de reportes', valor: stats.total, color: colores.texto },
        { etiqueta: 'Pendientes', valor: cantidad(stats.por_estado, 'Pendiente'), color: '#B26A00' },
        { etiqueta: 'En proceso', valor: cantidad(stats.por_estado, 'En proceso'), color: '#5E35B1' },
        { etiqueta: 'Resueltos', valor: cantidad(stats.por_estado, 'Resuelto'), color: colores.verde },
    ];
    const bloqueStats = (
        <View style={estilos.filaStats}>
        {tarjetas.map((t) => (
            <View key={t.etiqueta} style={estilos.stat}>
            <Text style={estilos.statEtiqueta}>{t.etiqueta}</Text>
            <Text style={[estilos.statNumero, { color: t.color }]}>{t.valor}</Text>
            </View>
        ))}
        </View>
    );

    // ---- Bloque 2: Resumen de riesgos (cuadros de colores del mockup) ----
    const bloqueResumen = (
        <View style={estilos.panel}>
        <Text style={estilos.panelTitulo}>Resumen de riesgos</Text>
        <View style={estilos.filaTiles}>
            {PRIORIDADES.map((p) => (
            <View key={p.nombre} style={[estilos.tile, { backgroundColor: p.fondo }]}>
                <Text style={[estilos.tileNumero, { color: p.color }]}>{cantidad(stats.por_prioridad, p.nombre)}</Text>
                <Text style={estilos.tileEtiqueta}>{p.etiqueta}</Text>
            </View>
            ))}
        </View>
        {/* Los reportes aún sin nivel (hasta que integremos la IA) se muestran aparte */}
        {sinClasificar > 0 && (
            <Text style={[estilos.suave, { marginTop: 10 }]}>{sinClasificar} reporte(s) sin clasificar</Text>
        )}
        </View>
    );

    // ---- Bloque 3: lista compacta de reportes recientes ----
    const bloqueRecientes = (
        <View style={estilos.panel}>
        <View style={estilos.encabezado}>
            <Text style={estilos.panelTitulo}>Reportes recientes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ReportesAdmin')}>
            <Text style={estilos.verTodos}>Ver todos</Text>
            </TouchableOpacity>
        </View>
        {recientes.length === 0 && <Text style={estilos.suave}>Aún no hay reportes.</Text>}
        {recientes.map((r) => (
            <FilaReciente
            key={r.id_reporte}
            reporte={r}
            onPress={() => navigation.navigate('DetalleReporte', { id: r.id_reporte })}
            />
        ))}
        </View>
    );

    // ---- Bloques 4 y 5: gráficos de barras ----
    const bloqueCategorias = <GraficoBarras titulo="Reportes por categoría" datos={stats.por_categoria} color={colores.oscuro} />;
    const bloqueZonas = <GraficoBarras titulo="Zonas con más incidentes" datos={stats.por_bloque} color={colores.primario} />;

    return (
        <ScrollView contentContainerStyle={estilos.contenedor}>
        <Text style={estilos.titulo}>Dashboard</Text>
        <Text style={estilos.subtitulo}>Hola, {usuario.nombre.split(' ')[0]}. Este es el resumen de reportes del campus.</Text>

        {dosColumnas ? (
            // Escritorio ancho: columna principal a la izquierda, columna de 360px a la derecha
            <View style={estilos.dosColumnas}>
            <View style={{ flex: 1 }}>
                {bloqueStats}
                {bloqueCategorias}
                {bloqueZonas}
            </View>
            <View style={{ width: 360 }}>
                {bloqueResumen}
                {bloqueRecientes}
            </View>
            </View>
        ) : (
            // Pantallas medianas y celular: todo en una sola columna
            <>
            {bloqueStats}
            {bloqueResumen}
            {bloqueRecientes}
            {bloqueCategorias}
            {bloqueZonas}
            </>
        )}
        </ScrollView>
    );
}

const estilos = StyleSheet.create({
    contenedor: { padding: 24, paddingBottom: 48, maxWidth: 1200, width: '100%', alignSelf: 'center' },
    titulo: { fontSize: 30, fontWeight: '800', color: colores.texto },
    subtitulo: { color: colores.textoSuave, marginTop: 2, marginBottom: 6 },
    suave: { color: colores.textoSuave, fontSize: 13 },
    fecha: { color: colores.textoSuave, fontSize: 11, marginTop: 2 },
    error: { backgroundColor: colores.errorFondo, color: colores.error, padding: 10, borderRadius: 8 },

    dosColumnas: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },

    // flexWrap: en pantallas angostas las 4 tarjetas caen en 2 filas de 2
    filaStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
    stat: { flexGrow: 1, flexBasis: 130, backgroundColor: colores.blanco, borderRadius: 14, padding: 14 },
    statEtiqueta: { color: colores.textoSuave, fontSize: 12 },
    statNumero: { fontSize: 34, fontWeight: '800', marginTop: 4 },

    panel: { backgroundColor: colores.blanco, borderRadius: 14, padding: 16, marginTop: 12 },
    panelTitulo: { fontWeight: '800', fontSize: 16, color: colores.texto, marginBottom: 10 },
    encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    verTodos: { color: colores.primario, fontWeight: '700', fontSize: 13, marginBottom: 10 },

    // Cuadros de colores del resumen de riesgos
    filaTiles: { flexDirection: 'row', gap: 8 },
    tile: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    tileNumero: { fontSize: 26, fontWeight: '800' },
    tileEtiqueta: { color: colores.textoSuave, fontSize: 12, marginTop: 2 },

    // Lista compacta de recientes
    filaReciente: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#EEF0F6',
    },
    iconoReciente: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    recienteTitulo: { fontWeight: '700', color: colores.texto, fontSize: 14 },

    filaBarra: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 5 },
    barraNombre: { width: 110, color: colores.texto, fontSize: 13 },
    barraFondo: { flex: 1, height: 10, borderRadius: 5, backgroundColor: '#E8ECF4', overflow: 'hidden' },
    barraRelleno: { height: 10, borderRadius: 5 },
    barraCantidad: { width: 28, textAlign: 'right', fontWeight: '700', color: colores.texto },
});