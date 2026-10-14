import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import Insignia from '../components/Insignia';
import { formatearFecha } from '../utils/fechas';
import { colores } from '../theme';

export default function DetalleReporteScreen({ route }) {
    // route.params trae lo que se envió en navigate('DetalleReporte', { id })
    const { id } = route.params;

    const [reporte, setReporte] = useState(null);
    const [error, setError] = useState('');

    useFocusEffect(
        useCallback(() => {
        api(`/reportes/${id}`)
            .then(setReporte)
            .catch((e) => setError(e.message));
        }, [id])
    );

    if (error) return <Text style={[estilos.error, { margin: 20 }]}>{error}</Text>;
    if (!reporte) return <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colores.primario} />;

    const ubicacion = [reporte.sede, reporte.bloque, reporte.piso_area].filter(Boolean).join(' · ');
    const a = reporte.analisis; // null mientras no integremos la IA (Paso 8)

    return (
        <ScrollView contentContainerStyle={estilos.contenedor}>
        <Text style={estilos.codigo}>Reporte #{reporte.id_reporte} · {formatearFecha(reporte.fecha_reporte)}</Text>
        <Text style={estilos.titulo}>{reporte.titulo}</Text>

        <View style={estilos.filaInsignias}>
            <Insignia tipo="estado" texto={reporte.estado} />
            <Insignia tipo="prioridad" texto={reporte.prioridad} />
        </View>

        <Text style={estilos.etiqueta}>CATEGORÍA</Text>
        <Text style={estilos.valor}>{reporte.categoria || 'Pendiente de clasificación'}</Text>

        <Text style={estilos.etiqueta}>UBICACIÓN</Text>
        <Text style={estilos.valor}>{ubicacion || 'Sin ubicación textual'}</Text>
        {reporte.latitud && (
            <Text style={estilos.suave}>GPS: {Number(reporte.latitud).toFixed(5)}, {Number(reporte.longitud).toFixed(5)}</Text>
        )}

        <Text style={estilos.etiqueta}>DESCRIPCIÓN</Text>
        <Text style={estilos.valor}>{reporte.descripcion}</Text>

        {/* Bloque de IA: aparece cuando exista un análisis, o un aviso mientras tanto */}
        <View style={estilos.cajaIA}>
            <Text style={estilos.cajaIATitulo}>Evaluación SafeCampus IA</Text>
            {a ? (
            <>
                <Text style={estilos.valor}>Riesgo: {a.riesgo_detectado}</Text>
                <Text style={estilos.valor}>Prioridad sugerida: {a.prioridad_sugerida}</Text>
                <Text style={estilos.suave}>{a.recomendaciones}</Text>
            </>
            ) : (
            <Text style={estilos.suave}>El análisis automático aún no está disponible para este reporte.</Text>
            )}
        </View>

        {/* Línea de tiempo del historial (RF09) */}
        <Text style={[estilos.etiqueta, { marginTop: 24 }]}>HISTORIAL</Text>
        {reporte.historial.map((h, i) => (
            <View key={i} style={estilos.itemHistorial}>
            {/* Punto + línea vertical que conecta con el siguiente evento */}
            <View style={estilos.columnaLinea}>
                <View style={estilos.punto} />
                {i < reporte.historial.length - 1 && <View style={estilos.linea} />}
            </View>
            <View style={{ flex: 1, paddingBottom: 18 }}>
                <Text style={estilos.historialEstado}>{h.estado}</Text>
                {h.comentario ? <Text style={estilos.valor}>{h.comentario}</Text> : null}
                <Text style={estilos.suave}>
                {formatearFecha(h.fecha_cambio)}{h.cambiado_por ? ` · ${h.cambiado_por}` : ''}
                </Text>
            </View>
            </View>
        ))}
        </ScrollView>
    );
}

const estilos = StyleSheet.create({
    contenedor: { padding: 20, paddingBottom: 48, maxWidth: 720, width: '100%', alignSelf: 'center' },
    codigo: { color: colores.textoSuave, fontSize: 12 },
    titulo: { fontSize: 24, fontWeight: '800', color: colores.texto, marginTop: 6 },
    filaInsignias: { flexDirection: 'row', gap: 8, marginTop: 12 },
    etiqueta: { fontSize: 12, color: colores.textoSuave, marginTop: 18, marginBottom: 4, letterSpacing: 0.5 },
    valor: { fontSize: 15, color: colores.texto, lineHeight: 22 },
    suave: { color: colores.textoSuave, marginTop: 2 },
    error: { backgroundColor: colores.errorFondo, color: colores.error, padding: 10, borderRadius: 8 },

    cajaIA: { backgroundColor: '#E8F0FE', borderRadius: 12, padding: 14, marginTop: 20 },
    cajaIATitulo: { fontWeight: '800', color: '#1A4FA0', marginBottom: 6 },

    itemHistorial: { flexDirection: 'row', gap: 12 },
    columnaLinea: { alignItems: 'center', width: 14 },
    punto: { width: 12, height: 12, borderRadius: 6, backgroundColor: colores.primario, marginTop: 4 },
    linea: { flex: 1, width: 2, backgroundColor: colores.borde, marginTop: 2 },
    historialEstado: { fontWeight: '700', color: colores.texto },
});