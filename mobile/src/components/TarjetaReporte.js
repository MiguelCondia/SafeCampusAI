import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Insignia from './Insignia';
import { fechaRelativa } from '../utils/fechas';
import { colores } from '../theme';

// Cómo se muestra cada estado en la caja inferior (RF08).
// Mensajes pensados para el estudiante: qué significa ese estado para su reporte
const ESTADOS = {
    'Pendiente':   { icono: 'time-outline',      color: '#B26A00', fondo: '#FFF4E0', titulo: 'En espera de revisión',  detalle: 'Un administrador revisará tu reporte pronto' },
    'En revisión': { icono: 'eye-outline',       color: '#1A4FA0', fondo: '#E8F0FE', titulo: 'En revisión',            detalle: 'Un administrador está evaluando el reporte' },
    'En proceso':  { icono: 'construct-outline', color: '#5E35B1', fondo: '#EDE7F6', titulo: 'En atención activa',     detalle: 'Se está trabajando en la solución' },
    'Resuelto':    { icono: 'checkmark-circle',  color: '#0F7A55', fondo: '#E3F7EE', titulo: 'Resuelto',               detalle: 'El problema fue solucionado' },
    'Cerrado':     { icono: 'lock-closed-outline', color: '#5B6478', fondo: '#ECEFF3', titulo: 'Cerrado',              detalle: 'Reporte finalizado' },
};

// Uso:  <TarjetaReporte reporte={r} onPress={() => ...} />
export default function TarjetaReporte({ reporte, onPress, admin = false }) {
    // Si llega un estado desconocido, usamos "Pendiente" para que la pantalla no se rompa (RNF12)
    const info = ESTADOS[reporte.estado] || ESTADOS['Pendiente'];

    // Código tipo "#SC-0005": padStart rellena con ceros a la izquierda hasta 4 dígitos
    const codigo = `#SC-${String(reporte.id_reporte).padStart(4, '0')}`;

    // Unimos solo las partes de ubicación que existan
    const ubicacion = [reporte.bloque, reporte.piso_area].filter(Boolean).join(' · ') || reporte.sede || 'Sin ubicación';

    return (
        <TouchableOpacity style={estilos.tarjeta} onPress={onPress} activeOpacity={0.85}>
        {/* Fila superior: prioridad + código a la izquierda, fecha a la derecha */}
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
            {/* flex:1 + numberOfLines evita que una ubicación larga desborde la tarjeta */}
            <Text style={estilos.ubicacion} numberOfLines={1}>{ubicacion}</Text>
        </View>

        {/* Modo administrador: autor + insignia de estado. Modo estudiante: caja explicativa */}
        {admin ? (
            <View style={estilos.filaAdmin}>
            <Text style={estilos.autor} numberOfLines={1}>Reportó: {reporte.autor}</Text>
            <Insignia tipo="estado" texto={reporte.estado} />
            </View>
        ) : (
            <View style={[estilos.cajaEstado, { backgroundColor: info.fondo }]}>
            <Ionicons name={info.icono} size={22} color={info.color} />
            <View style={{ flex: 1 }}>
                <Text style={[estilos.estadoTitulo, { color: info.color }]}>{info.titulo}</Text>
                <Text style={estilos.estadoDetalle}>{info.detalle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={info.color} />
            </View>
        )}
        </TouchableOpacity>
    );
}

const estilos = StyleSheet.create({
    tarjeta: {
        backgroundColor: colores.blanco, borderRadius: 14, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    grupo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    codigo: { color: colores.textoSuave, fontSize: 12 },
    fecha: { color: colores.textoSuave, fontSize: 12 },

    titulo: { fontSize: 17, fontWeight: '700', color: colores.texto, marginTop: 12 },
    filaUbicacion: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    ubicacion: { flex: 1, color: colores.textoSuave, fontSize: 13 },

    cajaEstado: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderRadius: 10, padding: 12, marginTop: 14,
    },
    estadoTitulo: { fontWeight: '700', fontSize: 14 },
    estadoDetalle: { color: colores.textoSuave, fontSize: 12, marginTop: 1 },

    filaAdmin: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
    autor: { flex: 1, color: colores.textoSuave, fontSize: 13, marginRight: 8 },
});