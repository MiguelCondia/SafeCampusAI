import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTema, useEstilos } from '../theme';

const crearEstilos = (colores) => StyleSheet.create({
    fila: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 8 },
    boton: {
        flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colores.borde,
        backgroundColor: colores.superficie, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14,
    },
    botonTexto: { color: colores.texto, fontWeight: '600' },
    deshabilitado: { opacity: 0.45 },
    miniaturas: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 12 },
    miniatura: { width: 92, height: 92, borderRadius: 10, backgroundColor: colores.neutroFondo },
    quitar: {
        position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12,
        backgroundColor: colores.primario, alignItems: 'center', justifyContent: 'center',
    },
    contador: { color: colores.textoSuave, fontSize: 12, marginTop: 8 },
    error: { color: colores.error, fontSize: 13, marginTop: 8 },
});

// Convierte lo que devuelve el selector al formato que usa subirArchivo
const aArchivo = (a) => ({ uri: a.uri, nombre: a.fileName || `foto-${Date.now()}.jpg`, tipo: a.mimeType || 'image/jpeg' });

// archivos: arreglo de { uri, nombre, tipo }. onChange recibe el arreglo actualizado.
export default function SelectorEvidencias({ archivos, onChange, max = 3 }) {
    const { colores } = useTema();
    const estilos = useEstilos(crearEstilos);
    const [aviso, setAviso] = React.useState('');
    const lleno = archivos.length >= max;

    async function tomarFoto() {
        setAviso('');
        const permiso = await ImagePicker.requestCameraPermissionsAsync();
        if (!permiso.granted) return setAviso('Sin permiso de cámara. Puedes elegir una foto de la galería.');
        const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
        if (!r.canceled) onChange([...archivos, aArchivo(r.assets[0])].slice(0, max));
    }

    async function elegir() {
        setAviso('');
        if (Platform.OS !== 'web') {
        const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permiso.granted) return setAviso('Sin permiso para acceder a las fotos.');
        }
        const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], quality: 0.7, allowsMultipleSelection: true, selectionLimit: max - archivos.length,
        });
        if (!r.canceled) onChange([...archivos, ...r.assets.map(aArchivo)].slice(0, max));
    }

    const quitar = (i) => onChange(archivos.filter((_, k) => k !== i));

    return (
        <View>
        <View style={estilos.fila}>
            {/* La cámara directa solo existe en el celular; en el navegador se usa la galería */}
            {Platform.OS !== 'web' && (
            <TouchableOpacity style={[estilos.boton, lleno && estilos.deshabilitado]} onPress={tomarFoto} disabled={lleno}>
                <Ionicons name="camera-outline" size={20} color={colores.texto} />
                <Text style={estilos.botonTexto}>Tomar foto</Text>
            </TouchableOpacity>
            )}
            <TouchableOpacity style={[estilos.boton, lleno && estilos.deshabilitado]} onPress={elegir} disabled={lleno}>
            <Ionicons name="images-outline" size={20} color={colores.texto} />
            <Text style={estilos.botonTexto}>{Platform.OS === 'web' ? 'Elegir imagen' : 'Elegir de la galería'}</Text>
            </TouchableOpacity>
        </View>

        {archivos.length > 0 && (
            <View style={estilos.miniaturas}>
            {archivos.map((a, i) => (
                <View key={a.uri + i}>
                <Image source={{ uri: a.uri }} style={estilos.miniatura} />
                <TouchableOpacity style={estilos.quitar} onPress={() => quitar(i)} accessibilityLabel="Quitar foto">
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
                </View>
            ))}
            </View>
        )}
        <Text style={estilos.contador}>{archivos.length} de {max} fotos</Text>
        {aviso ? <Text style={estilos.error}>{aviso}</Text> : null}
        </View>
    );
}