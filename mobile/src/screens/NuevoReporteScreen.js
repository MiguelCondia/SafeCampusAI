import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    ActivityIndicator, Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { colores } from '../theme';

// Zonas del campus tomadas de tu mockup. Más adelante podrían venir del backend.
const BLOQUES = ['Bloque A', 'Bloque B', 'Bloque C', 'Biblioteca Central', 'Cafetería', 'Gimnasio', 'Otro'];

const MAX_DESCRIPCION = 500; // igual que el contador del mockup

export default function NuevoReporteScreen({ navigation }) {
    // ---- Datos del formulario ----
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [idCategoria, setIdCategoria] = useState(null); // null = que la IA la sugiera después
    const [bloque, setBloque] = useState('');
    const [sede, setSede] = useState('');
    const [pisoArea, setPisoArea] = useState('');
    const [coords, setCoords] = useState(null); // { lat, lng } cuando se obtuvo el GPS

    // ---- Estado de la pantalla ----
    const [categorias, setCategorias] = useState([]);
    const [buscandoGPS, setBuscandoGPS] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState('');

    // Al abrir el formulario, pedimos las categorías al backend (ruta /catalogos del Paso 4)
    useEffect(() => {
        api('/catalogos')
        .then((datos) => setCategorias(datos.categorias))
        .catch((e) => setError(e.message));
    }, []);

    // Obtiene la ubicación del dispositivo (RF05)
    async function usarGPS() {
        setError('');
        setBuscandoGPS(true);
        try {
        // Primero pedimos permiso al usuario; si lo niega, no insistimos
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setError('No diste permiso de ubicación. Puedes indicar el bloque manualmente.');
            return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        } catch (e) {
        // RNF13: si el GPS falla, el reporte sigue siendo posible con texto
        setError('No se pudo obtener el GPS. Indica el bloque o el área manualmente.');
        } finally {
        setBuscandoGPS(false);
        }
    }

    async function enviar() {
        setError('');

        // Validaciones del cliente (el backend las repite)
        if (!titulo.trim()) return setError('Escribe un título para el incidente');
        if (!descripcion.trim()) return setError('Describe lo que ocurrió');
        if (!coords && !bloque && !sede.trim() && !pisoArea.trim()) {
        return setError('Indica dónde ocurrió: usa el GPS o selecciona un bloque');
        }

        setEnviando(true);
        try {
        const respuesta = await api('/reportes', {
            metodo: 'POST',
            cuerpo: {
            titulo: titulo.trim(),
            descripcion: descripcion.trim(),
            id_categoria: idCategoria,
            latitud: coords ? coords.lat : undefined,   // undefined = el campo no se envía
            longitud: coords ? coords.lng : undefined,
            tipo_ubicacion: coords ? 'gps' : 'manual',
            sede: sede.trim() || undefined,
            bloque: bloque || undefined,
            piso_area: pisoArea.trim() || undefined,
            },
        });
        // replace en vez de navigate: así, al darle "atrás" desde el detalle,
        // no vuelve a un formulario ya enviado
        navigation.replace('DetalleReporte', { id: respuesta.id_reporte });
        } catch (e) {
        setError(e.message);
        } finally {
        setEnviando(false);
        }
    }

    return (
        <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
        {/* ---- 1. Tipo de incidente ---- */}
        <Text style={estilos.seccion}>1. Tipo de incidente</Text>
        <Text style={estilos.ayuda}>Opcional: si no eliges, la IA lo clasificará.</Text>
        <View style={estilos.chips}>
            {categorias.map((c) => {
            const activa = idCategoria === c.id_categoria;
            return (
                <TouchableOpacity
                key={c.id_categoria}
                style={[estilos.chip, activa && estilos.chipActivo]}
                // Tocar la categoría ya elegida la deselecciona
                onPress={() => setIdCategoria(activa ? null : c.id_categoria)}
                >
                <Text style={[estilos.chipTexto, activa && estilos.chipTextoActivo]}>{c.nombre}</Text>
                </TouchableOpacity>
            );
            })}
        </View>

        {/* ---- 2. Información ---- */}
        <Text style={estilos.seccion}>2. Información del incidente</Text>
        <Text style={estilos.etiqueta}>TÍTULO</Text>
        <TextInput
            style={estilos.input}
            placeholder="Ej: Cableado expuesto en corredor B"
            value={titulo}
            onChangeText={setTitulo}
            maxLength={100} // el backend rechaza títulos de más de 100 caracteres
        />

        <View style={estilos.filaEtiqueta}>
            <Text style={estilos.etiqueta}>DESCRIPCIÓN</Text>
            <Text style={estilos.contador}>{descripcion.length} / {MAX_DESCRIPCION}</Text>
        </View>
        <TextInput
            style={[estilos.input, estilos.multilinea]}
            placeholder="Describe lo que observas: qué es, qué tan grave parece, si hay personas en peligro..."
            value={descripcion}
            onChangeText={setDescripcion}
            maxLength={MAX_DESCRIPCION}
            multiline
            textAlignVertical="top" // en Android el texto empieza arriba, no centrado
        />

        {/* ---- 3. Ubicación ---- */}
        <Text style={estilos.seccion}>3. Ubicación en campus</Text>

        <TouchableOpacity style={estilos.botonGPS} onPress={usarGPS} disabled={buscandoGPS}>
            {buscandoGPS ? (
            <ActivityIndicator color={colores.texto} />
            ) : (
            <>
                <Ionicons name="locate" size={20} color={colores.texto} />
                <Text style={estilos.botonGPSTexto}>
                {coords ? 'Actualizar mi ubicación GPS' : 'Usar mi ubicación GPS'}
                </Text>
            </>
            )}
        </TouchableOpacity>

        {/* Confirmación visual de que el GPS se capturó */}
        {coords && (
            <View style={estilos.gpsOk}>
            <Ionicons name="checkmark-circle" size={18} color={colores.verde} />
            <Text style={estilos.gpsOkTexto}>
                GPS capturado ({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)})
            </Text>
            </View>
        )}

        <Text style={estilos.etiqueta}>EDIFICIO / ZONA</Text>
        <View style={estilos.chips}>
            {BLOQUES.map((b) => {
            const activo = bloque === b;
            return (
                <TouchableOpacity
                key={b}
                style={[estilos.chip, activo && estilos.chipActivo]}
                onPress={() => setBloque(activo ? '' : b)}
                >
                <Text style={[estilos.chipTexto, activo && estilos.chipTextoActivo]}>{b}</Text>
                </TouchableOpacity>
            );
            })}
        </View>

        <Text style={estilos.etiqueta}>SEDE (OPCIONAL)</Text>
        <TextInput style={estilos.input} placeholder="Ej: Sede Principal" value={sede} onChangeText={setSede} />

        <Text style={estilos.etiqueta}>PISO, AULA O PUNTO EXACTO</Text>
        <TextInput
            style={estilos.input}
            placeholder="Ej: Piso 2, frente al Laboratorio de Física"
            value={pisoArea}
            onChangeText={setPisoArea}
        />

        {error ? <Text style={estilos.error}>{error}</Text> : null}

        <TouchableOpacity style={estilos.botonEnviar} onPress={enviar} disabled={enviando}>
            {enviando ? (
            <ActivityIndicator color={colores.blanco} />
            ) : (
            <>
                <Ionicons name="send" size={18} color={colores.blanco} />
                <Text style={estilos.botonEnviarTexto}>Enviar reporte</Text>
            </>
            )}
        </TouchableOpacity>
        </ScrollView>
    );
}

const estilos = StyleSheet.create({
    contenedor: { padding: 20, paddingBottom: 48, maxWidth: 720, width: '100%', alignSelf: 'center' },
    seccion: { fontSize: 18, fontWeight: '800', color: colores.texto, marginTop: 22 },
    ayuda: { color: colores.textoSuave, fontSize: 13, marginTop: 2, marginBottom: 8 },

    etiqueta: { fontSize: 12, color: colores.textoSuave, marginTop: 14, marginBottom: 6, letterSpacing: 0.5 },
    filaEtiqueta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    contador: { fontSize: 12, color: colores.textoSuave, marginTop: 14, marginBottom: 6 },

    input: {
        borderWidth: 1, borderColor: colores.borde, borderRadius: 10, padding: 12,
        backgroundColor: colores.blanco, fontSize: 16, color: colores.texto,
        ...Platform.select({ web: { outlineStyle: 'none' } }),
    },
    multilinea: { minHeight: 110 },

    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
        borderWidth: 1, borderColor: colores.borde, backgroundColor: colores.blanco,
    },
    chipActivo: { backgroundColor: colores.oscuro, borderColor: colores.oscuro },
    chipTexto: { color: colores.texto, fontSize: 14 },
    chipTextoActivo: { color: colores.blanco, fontWeight: '700' },

    botonGPS: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: 1, borderColor: colores.borde, backgroundColor: colores.blanco,
        borderRadius: 10, padding: 13, marginTop: 10,
    },
    botonGPSTexto: { color: colores.texto, fontWeight: '600' },
    gpsOk: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    gpsOkTexto: { color: colores.verde, fontSize: 13 },

    error: { backgroundColor: colores.errorFondo, color: colores.error, padding: 10, borderRadius: 8, marginTop: 16 },

    botonEnviar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#000', borderRadius: 12, padding: 16, marginTop: 24,
    },
    botonEnviarTexto: { color: colores.blanco, fontWeight: '700', fontSize: 16 },
});