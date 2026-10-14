import React, { useCallback, useEffect, useState } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Insignia from '../components/Insignia';
import { formatearFecha } from '../utils/fechas';
import { colores } from '../theme';

export default function DetalleReporteScreen({ route }) {
    const { id } = route.params;
    const { usuario } = useAuth();
    const esAdmin = usuario.rol === 'administrador';

    const [reporte, setReporte] = useState(null);
    const [error, setError] = useState('');

    // ---- Estado del panel de administración ----
    const [estados, setEstados] = useState([]);
    const [nuevoEstado, setNuevoEstado] = useState(null); // id del estado elegido
    const [comentario, setComentario] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    // useCallback: la función conserva su identidad entre renders, así podemos
    // usarla como dependencia y volver a llamarla después de cambiar el estado
    const cargar = useCallback(async () => {
        try {
        setReporte(await api(`/reportes/${id}`));
        setError('');
        } catch (e) {
        setError(e.message);
        }
    }, [id]);

    useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

    // Solo el admin necesita la lista de estados
    useEffect(() => {
        if (esAdmin) api('/catalogos').then((d) => setEstados(d.estados)).catch(() => {});
    }, [esAdmin]);

    // PATCH /reportes/:id/estado (RF08). El backend guarda el cambio en el historial (RF09)
    async function guardarEstado() {
        setMensaje({ tipo: '', texto: '' });
        if (!nuevoEstado) {
        return setMensaje({ tipo: 'error', texto: 'Selecciona el nuevo estado' });
        }
        setGuardando(true);
        try {
        await api(`/reportes/${id}/estado`, {
            metodo: 'PATCH',
            cuerpo: { id_estado: nuevoEstado, comentario: comentario.trim() || undefined },
        });
        setComentario('');
        setNuevoEstado(null);
        setMensaje({ tipo: 'ok', texto: 'Estado actualizado correctamente' });
        await cargar(); // recargamos para ver el nuevo estado y la nueva fila del historial
        } catch (e) {
        setMensaje({ tipo: 'error', texto: e.message });
        } finally {
        setGuardando(false);
        }
    }

    if (error) return <Text style={[estilos.error, { margin: 20 }]}>{error}</Text>;
    if (!reporte) return <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colores.primario} />;

    const ubicacion = [reporte.sede, reporte.bloque, reporte.piso_area].filter(Boolean).join(' · ');
    const a = reporte.analisis;

    return (
        <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
        <Text style={estilos.codigo}>
            Reporte #SC-{String(reporte.id_reporte).padStart(4, '0')} · {formatearFecha(reporte.fecha_reporte)}
        </Text>
        <Text style={estilos.titulo}>{reporte.titulo}</Text>

        <View style={estilos.filaInsignias}>
            <Insignia tipo="estado" texto={reporte.estado} />
            <Insignia tipo="prioridad" texto={reporte.prioridad} />
        </View>

        {/* El administrador ve quién reportó */}
        {esAdmin && (
            <>
            <Text style={estilos.etiqueta}>REPORTADO POR</Text>
            <Text style={estilos.valor}>{reporte.autor}</Text>
            </>
        )}

        <Text style={estilos.etiqueta}>CATEGORÍA</Text>
        <Text style={estilos.valor}>{reporte.categoria || 'Pendiente de clasificación'}</Text>

        <Text style={estilos.etiqueta}>UBICACIÓN</Text>
        <Text style={estilos.valor}>{ubicacion || 'Sin ubicación textual'}</Text>
        {reporte.latitud && (
            <Text style={estilos.suave}>
            GPS: {Number(reporte.latitud).toFixed(5)}, {Number(reporte.longitud).toFixed(5)}
            </Text>
        )}

        <Text style={estilos.etiqueta}>DESCRIPCIÓN</Text>
        <Text style={estilos.valor}>{reporte.descripcion}</Text>

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

        {/* ---- PANEL DE ADMINISTRACIÓN: solo visible para administradores (RNF04) ----
            Ojo: ocultarlo en la app es solo comodidad. La seguridad real está en el backend,
            que rechaza con 403 el PATCH si quien lo envía no es administrador. */}
        {esAdmin && (
            <View style={estilos.panelAdmin}>
            <Text style={estilos.panelAdminTitulo}>Gestionar reporte</Text>

            <Text style={estilos.etiqueta}>CAMBIAR ESTADO A</Text>
            <View style={estilos.chips}>
                {estados.map((e) => {
                const activo = nuevoEstado === e.id_estado;
                // No ofrecemos el estado en el que ya está el reporte
                if (e.nombre === reporte.estado) return null;
                return (
                    <TouchableOpacity
                    key={e.id_estado}
                    style={[estilos.chip, activo && estilos.chipActivo]}
                    onPress={() => setNuevoEstado(activo ? null : e.id_estado)}
                    >
                    <Text style={[estilos.chipTexto, activo && estilos.chipTextoActivo]}>{e.nombre}</Text>
                    </TouchableOpacity>
                );
                })}
            </View>

            <Text style={estilos.etiqueta}>COMENTARIO (OPCIONAL)</Text>
            <TextInput
                style={estilos.input}
                placeholder="Ej: Cuadrilla de electricistas asignada"
                value={comentario}
                onChangeText={setComentario}
                multiline
            />

            {mensaje.texto ? (
                <Text style={mensaje.tipo === 'ok' ? estilos.ok : estilos.error}>{mensaje.texto}</Text>
            ) : null}

            <TouchableOpacity style={estilos.botonGuardar} onPress={guardarEstado} disabled={guardando}>
                {guardando
                ? <ActivityIndicator color={colores.blanco} />
                : <Text style={estilos.botonGuardarTexto}>Actualizar estado</Text>}
            </TouchableOpacity>
            </View>
        )}

        {/* ---- Historial (RF09) ---- */}
        <Text style={[estilos.etiqueta, { marginTop: 24 }]}>HISTORIAL</Text>
        {reporte.historial.map((h, i) => (
            <View key={i} style={estilos.itemHistorial}>
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
    error: { backgroundColor: colores.errorFondo, color: colores.error, padding: 10, borderRadius: 8, marginTop: 10 },
    ok: { backgroundColor: '#E3F7EE', color: '#0F7A55', padding: 10, borderRadius: 8, marginTop: 10 },

    cajaIA: { backgroundColor: '#E8F0FE', borderRadius: 12, padding: 14, marginTop: 20 },
    cajaIATitulo: { fontWeight: '800', color: '#1A4FA0', marginBottom: 6 },

    panelAdmin: {
        backgroundColor: colores.blanco, borderRadius: 14, padding: 16, marginTop: 20,
        borderWidth: 1, borderColor: colores.borde,
    },
    panelAdminTitulo: { fontSize: 17, fontWeight: '800', color: colores.texto },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
        borderWidth: 1, borderColor: colores.borde, backgroundColor: colores.fondo,
    },
    chipActivo: { backgroundColor: colores.oscuro, borderColor: colores.oscuro },
    chipTexto: { color: colores.texto, fontSize: 14 },
    chipTextoActivo: { color: colores.blanco, fontWeight: '700' },
    input: {
        borderWidth: 1, borderColor: colores.borde, borderRadius: 10, padding: 12,
        backgroundColor: colores.fondo, fontSize: 15, color: colores.texto, minHeight: 60,
        ...Platform.select({ web: { outlineStyle: 'none' } }),
    },
    botonGuardar: { backgroundColor: '#000', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 14 },
    botonGuardarTexto: { color: colores.blanco, fontWeight: '700' },

    itemHistorial: { flexDirection: 'row', gap: 12 },
    columnaLinea: { alignItems: 'center', width: 14 },
    punto: { width: 12, height: 12, borderRadius: 6, backgroundColor: colores.primario, marginTop: 4 },
    linea: { flex: 1, width: 2, backgroundColor: colores.borde, marginTop: 2 },
    historialEstado: { fontWeight: '700', color: colores.texto },
});