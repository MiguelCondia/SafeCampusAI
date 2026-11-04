import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTema } from '../theme';

// Uso:  <Insignia tipo="estado" texto="Pendiente" />
//       <Insignia tipo="prioridad" texto={reporte.prioridad} />
export default function Insignia({ tipo, texto }) {
    const { colores } = useTema();

    // Los colores de cada estado/prioridad viven en theme.js (uno por modo)
    const tabla = tipo === 'estado' ? colores.estado : colores.prioridad;
    const etiqueta = texto || 'Sin clasificar';
    // Si no hay color definido (ej: prioridad null), usamos un gris neutro
    const color = tabla[texto] || { fondo: colores.neutroFondo, texto: colores.textoSuave };

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