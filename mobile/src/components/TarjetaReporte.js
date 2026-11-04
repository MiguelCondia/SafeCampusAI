import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Insignia from './Insignia';
import { fechaRelativa } from '../utils/fechas';
import { useTema, useEstilos } from '../theme';

// Icono y mensaje de cada estado (los colores salen del tema)
const ESTADOS = {
    'Pendiente':   { icono: 'time-outline',        titulo: 'En espera de revisión', detalle: 'Un administrador revisará tu reporte pronto' },
    'En revisión': { icono: 'eye-outline',         titulo: 'En revisión',           detalle: 'Un administrador está evaluando el reporte' },
    'En proceso':  { icono: 'construct-outline',   titulo: 'En atención activa',    detalle: 'Se está trabajando en la solución' },
    'Resuelto':    { icono: 'checkmark-circle',    titulo: 'Resuelto',              detalle: 'El problema fue solucionado' },
    'Cerrado':     { icono: 'lock-closed-outline', titulo: 'Cerrado',               detalle: 'Reporte finalizado' },
};

const crearEstilos = (colores) => StyleSheet.create({
    tarjeta: {
        backgroundColor: colores.superficie, borderRadius: 14, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    grupo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    codigo: { color: colores.textoSuave, fontSize: 12 },
    fecha: { color: colores.textoSuave, fontSize: 12 },
    titulo: { fontSize: 17, fontWeight: '700', color: colores.texto, marginTop: 12 },
    filaUbicacion: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    ubicacion: { flex: 1, color: colores.textoSuave, fontSize: 13 },
    cajaEstado: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, padding: 12, marginTop: 14 },
    estadoTitulo: { fontWeight: '700', fontSize: 14 },
    estadoDetalle: { color: colores.textoSuave, fontSize: 12, marginTop: 1 },
    filaAdmin: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
    autor: { flex: 1, color: colores.textoSuave, fontSize: 13, marginRight: 8 },
});

export default function TarjetaReporte({ reporte, onPress, admin = false }) {
    const { colores } = useTema();
    const estilos = useEstilos(crearEstilos);

    // Si llega un estado desconocido, usamos "Pendiente" para no romper la pantalla (RNF12)
    const info = ESTADOS[reporte.estado] || ESTADOS['Pendiente'];
    const tono = colores.estado[reporte.estado] || colores.estado['Pendiente'];

    const codigo = `#SC-${String(reporte.id_reporte).padStart(4, '0')}`;
    const ubicacion = [reporte.bloque, reporte.piso_area].filter(Boolean).join(' · ') || reporte.sede || 'Sin ubicación';

    return (
        <TouchableOpacity style={estilos.tarjeta} onPress={onPress} activeOpacity={0.85}>
        <View style={estilos.fila}>
            <View style={estilos.grupo}>
            <Insignia tipo="prioridad" texto={reporte.prioridad} />
            <Text style={estilos.codigo}>{codigo}</Text>
            </View>
            <Text style={estilos.fecha}>{fechaRelativa(reporte.fecha_reporte)}</Text>
        </View>

        <Text style={estilos.titulo}>{reporte.titulo}</Text>

        <View style={estilos.filaUbicacion}>
            <Ionicons name="location-outline" size={15} color={colores.textoSuave} />
            <Text style={estilos.ubicacion} numberOfLines={1}>{ubicacion}</Text>
        </View>

        {/* Administrador: autor + insignia. Estudiante: caja explicativa del estado */}
        {admin ? (
            <View style={estilos.filaAdmin}>
            <Text style={estilos.autor} numberOfLines={1}>Reportó: {reporte.autor}</Text>
            <Insignia tipo="estado" texto={reporte.estado} />
            </View>
        ) : (
            <View style={[estilos.cajaEstado, { backgroundColor: tono.fondo }]}>
            <Ionicons name={info.icono} size={22} color={tono.texto} />
            <View style={{ flex: 1 }}>
                <Text style={[estilos.estadoTitulo, { color: tono.texto }]}>{info.titulo}</Text>
                <Text style={estilos.estadoDetalle}>{info.detalle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={tono.texto} />
            </View>
        )}
        </TouchableOpacity>
    );
}