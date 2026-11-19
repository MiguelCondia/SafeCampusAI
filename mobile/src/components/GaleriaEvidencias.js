import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useEstilos } from '../theme';

const crearEstilos = (colores) => StyleSheet.create({
    etiqueta: { fontSize: 12, color: colores.textoSuave, marginTop: 18, marginBottom: 8, letterSpacing: 0.5 },
    fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    foto: { width: 110, height: 110, borderRadius: 10, backgroundColor: colores.neutroFondo },
});

// Miniaturas de las evidencias del reporte. Al tocar una, se abre en tamaño completo.
export default function GaleriaEvidencias({ evidencias }) {
    const estilos = useEstilos(crearEstilos);
    const fotos = (evidencias || []).filter((e) => e.url); // ignoramos las que no se pudieron firmar
    if (fotos.length === 0) return null;
    return (
        <View>
        <Text style={estilos.etiqueta}>EVIDENCIAS</Text>
        <View style={estilos.fila}>
            {fotos.map((e) => (
            <TouchableOpacity key={e.id_evidencia} onPress={() => Linking.openURL(e.url).catch(() => {})}>
                <Image source={{ uri: e.url }} style={estilos.foto} />
            </TouchableOpacity>
            ))}
        </View>
        </View>
    );
}