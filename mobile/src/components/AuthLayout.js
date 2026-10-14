import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
    Platform, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colores } from '../theme';

// Panel izquierdo oscuro del mockup. Solo se muestra en pantallas anchas.
function PanelIzquierdo() {
    return (
        // LinearGradient pinta un fondo con degradado diagonal (de arriba-izquierda a abajo-derecha)
        <LinearGradient
        colors={[colores.panelOscuro, colores.panelOscuro2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={estilos.panel}
        >
        {/* Bloque de texto con la barra vertical verde a la izquierda */}
        <View style={estilos.bloque}>
            <Text style={estilos.panelTitulo}>Vigilancia{'\n'}Inteligente.</Text>
            <Text style={estilos.panelTexto}>
            Protección proactiva para tu comunidad universitaria, respaldada por
            análisis en tiempo real y protocolos de respuesta instantánea.
            </Text>
        </View>

        {/* Indicador de estado, abajo a la derecha */}
        <View style={estilos.sistemaActivo}>
            <View style={estilos.punto} />
            <Text style={estilos.sistemaTexto}>SISTEMA ACTIVO</Text>
        </View>
        </LinearGradient>
    );
}

// "children" es lo que se coloque dentro: la tarjeta de login o de registro
export default function AuthLayout({ children }) {
    // useWindowDimensions entrega el ancho actual y se actualiza si la ventana cambia
    const { width } = useWindowDimensions();
    const esAncho = width >= 900; // 900px o más: modo escritorio (dos columnas)

    return (
        <View style={[estilos.raiz, { flexDirection: esAncho ? 'row' : 'column' }]}>
        {/* Solo en pantallas anchas mostramos el panel izquierdo */}
        {esAncho && <PanelIzquierdo />}

        {/* Lado derecho: aquí vive la tarjeta */}
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
            contentContainerStyle={estilos.contenido}
            keyboardShouldPersistTaps="handled"
            >
            {children}
            </ScrollView>
        </KeyboardAvoidingView>
        </View>
    );
}

const estilos = StyleSheet.create({
    raiz: { flex: 1, backgroundColor: colores.fondo },
    contenido: { flexGrow: 1, justifyContent: 'center', padding: 20 },

    panel: { flex: 1, justifyContent: 'center', padding: 48 },
    bloque: {
        borderLeftWidth: 4, borderLeftColor: colores.acento,
        paddingLeft: 32, maxWidth: 480,
    },
    panelTitulo: { color: colores.blanco, fontSize: 46, fontWeight: '800', lineHeight: 52 },
    panelTexto: { color: colores.textoPanel, fontSize: 17, lineHeight: 26, marginTop: 16 },

    sistemaActivo: {
        position: 'absolute', right: 32, bottom: 28,
        flexDirection: 'row', alignItems: 'center',
    },
    punto: { width: 10, height: 10, borderRadius: 5, backgroundColor: colores.acento, marginRight: 8 },
    sistemaTexto: { color: colores.acento, fontSize: 11, letterSpacing: 1 },
});