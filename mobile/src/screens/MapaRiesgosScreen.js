import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import MapaLeaflet from '../components/MapaLeaflet';
import { construirHtmlMapa } from '../utils/htmlMapa';
import { agruparZonas } from '../utils/zonas';
import { colores } from '../theme';

const NIVELES = [
    { nombre: 'Crítico', etiqueta: 'Críticos', color: '#E11D48', fondo: '#FDECEF' },
    { nombre: 'Alto',    etiqueta: 'Altos',    color: '#EA580C', fondo: '#FFF1E6' },
    { nombre: 'Medio',   etiqueta: 'Medios',   color: '#CA8A04', fondo: '#FEF9E1' },
    { nombre: 'Bajo',    etiqueta: 'Bajos',    color: '#0F9D6B', fondo: '#E8F8F1' },
];

export default function MapaRiesgosScreen({ navigation }) {
    const { width } = useWindowDimensions();
    const dosColumnas = width >= 1100; // con la barra lateral, el contenido necesita más ancho

    const [reportes, setReportes] = useState(null);
    const [error, setError] = useState('');
    const [filtro, setFiltro] = useState(null); // null = todas las prioridades

    useFocusEffect(
        useCallback(() => {
        let activo = true;
        api('/reportes')
            .then((d) => { if (activo) { setReportes(d); setError(''); } })
            .catch((e) => { if (activo) setError(e.message); });
        return () => { activo = false; };
        }, [])
    );

    // useMemo recalcula SOLO cuando cambian los reportes o el filtro (no en cada render).
    // Agrupar y construir el HTML es costoso y recargaría el mapa innecesariamente
    const { puntos, sinGPS, zonas, html, conteo } = useMemo(() => {
        const lista = reportes || [];
        // Solo los reportes con coordenadas pueden ir en el mapa (RNF13: los demás existen igual)
        const conGPS = lista.filter((r) => r.latitud != null && r.longitud != null);

        const conteo = {};
        conGPS.forEach((r) => { conteo[r.prioridad] = (conteo[r.prioridad] || 0) + 1; });

        const visibles = conGPS
        .filter((r) => !filtro || r.prioridad === filtro)
        .map((r) => ({
            id: r.id_reporte, titulo: r.titulo, prioridad: r.prioridad, estado: r.estado,
            bloque: r.bloque, lat: Number(r.latitud), lng: Number(r.longitud),
        }));

        const zonas = agruparZonas(visibles);
        return {
        puntos: visibles,
        sinGPS: lista.length - conGPS.length,
        zonas,
        conteo,
        html: construirHtmlMapa({ puntos: visibles, zonas }),
        };
    }, [reportes, filtro]);

    // useCallback mantiene estable la función para no reiniciar el listener del iframe
    const abrir = useCallback((id) => navigation.navigate('DetalleReporte', { id }), [navigation]);

    if (error) return <Text style={[estilos.error, { margin: 20 }]}>{error}</Text>;
    if (!reportes) return <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colores.primario} />;

    const bloqueMapa = (
        <View style={estilos.panelMapa}>
        {/* key={html}: si cambian los datos, React crea un mapa nuevo con el zoom ajustado */}
        <MapaLeaflet key={html.length} html={html} altura={dosColumnas ? 620 : 420} onSeleccionar={abrir} />
        </View>
    );

    const bloqueLateral = (
        <View>
        {/* Resumen por prioridad. Tocar un cuadro filtra el mapa por ese nivel */}
        <View style={estilos.panel}>
            <Text style={estilos.panelTitulo}>Resumen de riesgos</Text>
            <View style={estilos.filaTiles}>
            {NIVELES.map((n) => {
                const activo = filtro === n.nombre;
                return (
                <TouchableOpacity
                    key={n.nombre}
                    style={[estilos.tile, { backgroundColor: n.fondo }, activo && { borderColor: n.color, borderWidth: 2 }]}
                    onPress={() => setFiltro(activo ? null : n.nombre)}
                >
                    <Text style={[estilos.tileNumero, { color: n.color }]}>{conteo[n.nombre] || 0}</Text>
                    <Text style={estilos.tileEtiqueta}>{n.etiqueta}</Text>
                </TouchableOpacity>
                );
            })}
            </View>
            <Text style={estilos.suave}>
            {filtro ? `Mostrando solo: ${filtro}. Toca de nuevo para quitar el filtro.` : 'Toca un nivel para filtrar el mapa.'}
            </Text>
        </View>

        {/* RF13: lista de zonas con más concentración */}
        <View style={estilos.panel}>
            <Text style={estilos.panelTitulo}>Zonas de concentración</Text>
            {zonas.length === 0 && (
            <Text style={estilos.suave}>
                Ninguna zona tiene 2 o más reportes a menos de 60 m entre sí.
            </Text>
            )}
            {zonas.map((z, i) => (
            <View key={i} style={estilos.filaZona}>
                <View style={estilos.puntoZona} />
                <Text style={estilos.zonaNombre}>{z.nombre}</Text>
                <Text style={estilos.zonaCantidad}>{z.count} reportes</Text>
            </View>
            ))}
        </View>

        {sinGPS > 0 && (
            <Text style={estilos.aviso}>
            {sinGPS} reporte(s) no tienen coordenadas y no aparecen en el mapa.
            </Text>
        )}
        </View>
    );

    return (
        <ScrollView contentContainerStyle={estilos.contenedor}>
        <Text style={estilos.titulo}>Mapa de riesgos</Text>
        <Text style={estilos.subtitulo}>
            {puntos.length} reporte(s) en el mapa. Las manchas rojas marcan zonas con varios incidentes cercanos.
        </Text>

        {dosColumnas ? (
            <View style={estilos.dosColumnas}>
            <View style={{ flex: 1 }}>{bloqueMapa}</View>
            <View style={{ width: 340 }}>{bloqueLateral}</View>
            </View>
        ) : (
            <>
            {bloqueMapa}
            {bloqueLateral}
            </>
        )}
        </ScrollView>
    );
}

const estilos = StyleSheet.create({
    contenedor: { padding: 24, paddingBottom: 48, maxWidth: 1300, width: '100%', alignSelf: 'center' },
    titulo: { fontSize: 30, fontWeight: '800', color: colores.texto },
    subtitulo: { color: colores.textoSuave, marginTop: 2, marginBottom: 14 },
    suave: { color: colores.textoSuave, fontSize: 13, marginTop: 8 },
    error: { backgroundColor: colores.errorFondo, color: colores.error, padding: 10, borderRadius: 8 },
    aviso: { backgroundColor: '#FFF4E0', color: '#B26A00', padding: 10, borderRadius: 8, marginTop: 12, fontSize: 13 },

    dosColumnas: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
    panelMapa: { backgroundColor: colores.blanco, borderRadius: 14, padding: 6 },

    panel: { backgroundColor: colores.blanco, borderRadius: 14, padding: 16, marginTop: 12 },
    panelTitulo: { fontWeight: '800', fontSize: 16, color: colores.texto, marginBottom: 10 },

    filaTiles: { flexDirection: 'row', gap: 8 },
    tile: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    tileNumero: { fontSize: 24, fontWeight: '800' },
    tileEtiqueta: { color: colores.textoSuave, fontSize: 12, marginTop: 2 },

    filaZona: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#EEF0F6' },
    puntoZona: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E11D48' },
    zonaNombre: { flex: 1, color: colores.texto, fontWeight: '600' },
    zonaCantidad: { color: colores.textoSuave, fontSize: 13 },
});