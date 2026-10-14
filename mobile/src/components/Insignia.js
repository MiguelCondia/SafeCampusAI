import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

// Colores por cada estado (RF08). Fondo suave + texto fuerte del mismo tono.
const COLORES_ESTADO = {
    'Pendiente':   { fondo: '#FFF4E0', texto: '#B26A00' },
    'En revisión': { fondo: '#E8F0FE', texto: '#1A4FA0' },
    'En proceso':  { fondo: '#EDE7F6', texto: '#5E35B1' },
    'Resuelto':    { fondo: '#E3F7EE', texto: '#0F7A55' },
    'Cerrado':     { fondo: '#ECEFF3', texto: '#5B6478' },
};

// Colores por nivel de prioridad (RF12): crítico rojo, alto naranja, medio amarillo, bajo verde
const COLORES_PRIORIDAD = {
    'Crítico': { fondo: '#FDE8E8', texto: '#C62828' },
    'Alto':    { fondo: '#FFEBDD', texto: '#D35400' },
    'Medio':   { fondo: '#FFF8DB', texto: '#9A7B00' },
    'Bajo':    { fondo: '#E3F7EE', texto: '#0F7A55' },
};

// Gris neutro para valores que aún no existen (ej: prioridad antes de que la IA clasifique)
const NEUTRO = { fondo: '#ECEFF3', texto: '#5B6478' };

// Uso:  <Insignia tipo="estado" texto="Pendiente" />
//       <Insignia tipo="prioridad" texto={reporte.prioridad} />
export default function Insignia({ tipo, texto }) {
    const tabla = tipo === 'estado' ? COLORES_ESTADO : COLORES_PRIORIDAD;

    // Si la prioridad es null (aún sin clasificar), mostramos "Sin clasificar"
    const etiqueta = texto || 'Sin clasificar';
    const color = tabla[texto] || NEUTRO;

    return (
        <View style={[estilos.caja, { backgroundColor: color.fondo }]}>
        <Text style={[estilos.texto, { color: color.texto }]}>{etiqueta}</Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    caja: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
    texto: { fontSize: 12, fontWeight: '700' },
});