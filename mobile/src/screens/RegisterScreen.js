import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colores } from '../theme';
import AuthLayout from '../components/AuthLayout';

export default function RegisterScreen({ navigation }) {
    const { registrar } = useAuth();

    const [nombre, setNombre] = useState('');
    const [correo, setCorreo] = useState('');
    const [telefono, setTelefono] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);

    async function manejarRegistro() {
        setError('');

        // Validaciones en el cliente (el backend las repite: nunca confiamos solo en el cliente)
        if (!nombre.trim() || !correo.trim() || !contrasena) {
        setError('Nombre, correo y contraseña son obligatorios');
        return;
        }
        if (contrasena.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres');
        return;
        }
        if (contrasena !== confirmar) {
        setError('Las contraseñas no coinciden');
        return;
        }

        setEnviando(true);
        try {
        await registrar(nombre.trim(), correo.trim(), contrasena, telefono.trim());
        } catch (e) {
        setError(e.message); // ej: "Ya existe una cuenta con ese correo"
        } finally {
        setEnviando(false);
        }
    }

    return (
        <AuthLayout
        style={{ flex: 1, backgroundColor: colores.fondo }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        <AuthLayout contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
            <View style={estilos.tarjeta}>
            <Image source={require('../../assets/logo.png')} style={{ width: 72, height: 72, alignSelf: 'center' }} resizeMode="contain" />
            <Text style={estilos.titulo}>Crear cuenta</Text>
            <Text style={estilos.subtitulo}>Regístrate para reportar riesgos en tu campus</Text>

            <Text style={estilos.etiqueta}>NOMBRE COMPLETO</Text>
            <TextInput style={estilos.input} value={nombre} onChangeText={setNombre} />

            <Text style={estilos.etiqueta}>CORREO INSTITUCIONAL</Text>
            <TextInput
                style={estilos.input} value={correo} onChangeText={setCorreo}
                autoCapitalize="none" keyboardType="email-address"
            />

            <Text style={estilos.etiqueta}>TELÉFONO (OPCIONAL)</Text>
            <TextInput
                style={estilos.input} value={telefono} onChangeText={setTelefono}
                keyboardType="phone-pad"
            />

            <Text style={estilos.etiqueta}>CONTRASEÑA</Text>
            <TextInput style={estilos.input} value={contrasena} onChangeText={setContrasena} secureTextEntry />

            <Text style={estilos.etiqueta}>CONFIRMAR CONTRASEÑA</Text>
            <TextInput style={estilos.input} value={confirmar} onChangeText={setConfirmar} secureTextEntry />

            {error ? <Text style={estilos.error}>{error}</Text> : null}

            <TouchableOpacity style={estilos.boton} onPress={manejarRegistro} disabled={enviando}>
                {enviando
                ? <ActivityIndicator color={colores.blanco} />
                : <Text style={estilos.botonTexto}>Registrarme</Text>}
            </TouchableOpacity>

            {/* goBack vuelve a la pantalla anterior (Login) */}
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={estilos.enlace}>
                ¿Ya tienes cuenta? <Text style={estilos.enlaceFuerte}>Inicia sesión</Text>
                </Text>
            </TouchableOpacity>
            </View>
        </AuthLayout>
        </AuthLayout>
    );
}

const estilos = StyleSheet.create({
    contenedor: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    tarjeta: {
        backgroundColor: colores.blanco, borderRadius: 16, padding: 24,
        width: '100%', maxWidth: 420, alignSelf: 'center',
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    },
    titulo: { fontSize: 26, fontWeight: '800', textAlign: 'center', color: colores.texto },
    subtitulo: { textAlign: 'center', color: colores.textoSuave, marginBottom: 20, marginTop: 4 },
    etiqueta: { fontSize: 12, color: colores.textoSuave, marginBottom: 6, marginTop: 8 },
    input: {
        borderWidth: 1, borderColor: colores.borde, borderRadius: 10,
        padding: 12, backgroundColor: colores.fondo, fontSize: 16,
    },
    error: {
        backgroundColor: colores.errorFondo, color: colores.error,
        padding: 10, borderRadius: 8, marginTop: 12,
    },
    boton: {
        backgroundColor: '#000', borderRadius: 10, padding: 14,
        alignItems: 'center', marginTop: 20,
    },
    botonTexto: { color: colores.blanco, fontWeight: '700', fontSize: 16 },
    enlace: { textAlign: 'center', marginTop: 20, color: colores.textoSuave },
    enlaceFuerte: { color: colores.texto, fontWeight: '700' },
});