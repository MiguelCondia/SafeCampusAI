import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Image, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { colores } from '../theme';

export default function RegisterScreen({ navigation }) {
    const { registrar } = useAuth();

    const [nombre, setNombre] = useState('');
    const [correo, setCorreo] = useState('');
    const [telefono, setTelefono] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [verContrasena, setVerContrasena] = useState(false);
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);

    async function manejarRegistro() {
        setError('');

        // Validaciones en el cliente (el backend las repite)
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
        // Al cambiar "usuario" en el contexto, el navegador entra solo al panel
        } catch (e) {
        setError(e.message);
        } finally {
        setEnviando(false);
        }
    }

    return (
        <AuthLayout>
        <View style={estilos.tarjeta}>
            <Image
            source={require('../../assets/logo.png')}
            style={estilos.logo}
            resizeMode="contain"
            />
            <Text style={estilos.titulo}>Crear cuenta</Text>
            <Text style={estilos.subtitulo}>Regístrate para reportar riesgos en tu campus</Text>

            <Text style={estilos.etiqueta}>NOMBRE COMPLETO</Text>
            <View style={estilos.campo}>
            <Ionicons name="person-outline" size={20} color={colores.textoSuave} />
            <TextInput style={estilos.input} value={nombre} onChangeText={setNombre} />
            </View>

            <Text style={estilos.etiqueta}>CORREO INSTITUCIONAL</Text>
            <View style={estilos.campo}>
            <Ionicons name="mail-outline" size={20} color={colores.textoSuave} />
            <TextInput
                style={estilos.input}
                value={correo}
                onChangeText={setCorreo}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            </View>

            <Text style={estilos.etiqueta}>TELÉFONO (OPCIONAL)</Text>
            <View style={estilos.campo}>
            <Ionicons name="call-outline" size={20} color={colores.textoSuave} />
            <TextInput
                style={estilos.input}
                value={telefono}
                onChangeText={setTelefono}
                keyboardType="phone-pad"
            />
            </View>

            <Text style={estilos.etiqueta}>CONTRASEÑA</Text>
            <View style={estilos.campo}>
            <Ionicons name="lock-closed-outline" size={20} color={colores.textoSuave} />
            <TextInput
                style={estilos.input}
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry={!verContrasena}
            />
            <TouchableOpacity onPress={() => setVerContrasena(!verContrasena)}>
                <Ionicons
                name={verContrasena ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colores.textoSuave}
                />
            </TouchableOpacity>
            </View>

            <Text style={estilos.etiqueta}>CONFIRMAR CONTRASEÑA</Text>
            <View style={estilos.campo}>
            <Ionicons name="lock-closed-outline" size={20} color={colores.textoSuave} />
            <TextInput
                style={estilos.input}
                value={confirmar}
                onChangeText={setConfirmar}
                secureTextEntry={!verContrasena}
                onSubmitEditing={manejarRegistro}
            />
            </View>

            {error ? <Text style={estilos.error}>{error}</Text> : null}

            <TouchableOpacity style={estilos.boton} onPress={manejarRegistro} disabled={enviando}>
            {enviando ? (
                <ActivityIndicator color={colores.blanco} />
            ) : (
                <Text style={estilos.botonTexto}>Registrarme</Text>
            )}
            </TouchableOpacity>

            {/* navigate('Login') funciona aunque se haya llegado desde la landing
                (goBack falla si no hay pantalla anterior, por ejemplo al recargar) */}
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={estilos.enlace}>
                ¿Ya tienes cuenta? <Text style={estilos.enlaceFuerte}>Inicia sesión</Text>
            </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Landing')}>
            <Text style={[estilos.enlace, { marginTop: 12 }]}>← Volver al inicio</Text>
            </TouchableOpacity>
        </View>
        </AuthLayout>
    );
}

const estilos = StyleSheet.create({
    tarjeta: {
        backgroundColor: colores.blanco, borderRadius: 20, padding: 32,
        width: '100%', maxWidth: 420, alignSelf: 'center',
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    },
    logo: { width: 72, height: 72, alignSelf: 'center', marginBottom: 4 },
    titulo: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: colores.texto },
    subtitulo: { textAlign: 'center', color: colores.textoSuave, marginTop: 4, marginBottom: 20 },

    etiqueta: { fontSize: 12, color: colores.textoSuave, marginBottom: 6, marginTop: 8, letterSpacing: 0.5 },
    campo: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: colores.borde, borderRadius: 10,
        paddingHorizontal: 12, backgroundColor: colores.fondo,
    },
    input: {
        flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 16, color: colores.texto,
        ...Platform.select({ web: { outlineStyle: 'none' } }),
    },

    error: {
        backgroundColor: colores.errorFondo, color: colores.error,
        padding: 10, borderRadius: 8, marginTop: 12,
    },
    boton: {
        backgroundColor: '#000', borderRadius: 10, padding: 15,
        alignItems: 'center', marginTop: 20,
    },
    botonTexto: { color: colores.blanco, fontWeight: '700', fontSize: 16 },
    enlace: { textAlign: 'center', marginTop: 20, color: colores.textoSuave },
    enlaceFuerte: { color: colores.texto, fontWeight: '700', textDecorationLine: 'underline' },
});