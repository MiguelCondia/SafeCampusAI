import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Image, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { colores } from '../theme';

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();

    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [verContrasena, setVerContrasena] = useState(false); // controla el "ojito"
    const [error, setError] = useState('');
    const [aviso, setAviso] = useState(''); // mensajes informativos (funciones no disponibles aún)
    const [enviando, setEnviando] = useState(false);

    async function manejarLogin() {
        setError('');
        setAviso('');

        if (!correo.trim() || !contrasena) {
        setError('Ingresa tu correo y contraseña');
        return;
        }

        setEnviando(true);
        try {
        await login(correo.trim(), contrasena);
        } catch (e) {
        setError(e.message);
        } finally {
        setEnviando(false);
        }
    }

    // Google, Microsoft y "olvidaste tu contraseña" requieren servicios que
    // aún no tenemos en el backend. Mostramos un aviso honesto en vez de
    // dejar botones que no hacen nada.
    function noDisponible(funcion) {
        setError('');
        setAviso(`${funcion} estará disponible en una próxima versión.`);
    }

    return (
        <AuthLayout>
        <View style={estilos.tarjeta}>
            {/* Barra degradada superior (negro -> verde menta), como en el mockup.
                Va en position:absolute para no empujar el contenido. */}
            <LinearGradient
            colors={['#000000', colores.acento]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={estilos.barraSuperior}
            />

            {/* Logo: reemplaza al texto rojo "SafeCampus IA" */}
            <Image
            source={require('../../assets/logo.png')}
            style={estilos.logo}
            resizeMode="contain"
            />

            <Text style={estilos.titulo}>Acceso Seguro</Text>
            <Text style={estilos.subtitulo}>Ingresa con tus credenciales institucionales</Text>

            {/* ---- Campo de correo ---- */}
            <Text style={estilos.etiqueta}>CORREO INSTITUCIONAL</Text>
            <View style={estilos.campo}>
            <Ionicons name="mail-outline" size={20} color={colores.textoSuave} />
            <TextInput
                style={estilos.input}
                placeholder="usuario@universidad.edu"
                placeholderTextColor="#9AA2B5"
                value={correo}
                onChangeText={setCorreo}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            </View>

            {/* ---- Campo de contraseña, con enlace de recuperación a la derecha ---- */}
            <View style={estilos.filaEtiqueta}>
            <Text style={estilos.etiqueta}>CONTRASEÑA</Text>
            <TouchableOpacity onPress={() => noDisponible('La recuperación de contraseña')}>
                <Text style={estilos.olvido}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            </View>
            <View style={estilos.campo}>
            <Ionicons name="lock-closed-outline" size={20} color={colores.textoSuave} />
            <TextInput
                style={estilos.input}
                placeholder="••••••••"
                placeholderTextColor="#9AA2B5"
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry={!verContrasena} // si verContrasena es true, se muestra el texto
                onSubmitEditing={manejarLogin}   // la tecla Enter también inicia sesión
            />
            {/* El ojito alterna entre mostrar y ocultar */}
            <TouchableOpacity onPress={() => setVerContrasena(!verContrasena)}>
                <Ionicons
                name={verContrasena ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colores.textoSuave}
                />
            </TouchableOpacity>
            </View>

            {error ? <Text style={estilos.error}>{error}</Text> : null}
            {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}

            {/* ---- Botón principal ---- */}
            <TouchableOpacity style={estilos.boton} onPress={manejarLogin} disabled={enviando}>
            {enviando ? (
                <ActivityIndicator color={colores.blanco} />
            ) : (
                <View style={estilos.botonContenido}>
                <Text style={estilos.botonTexto}>Iniciar Sesión</Text>
                <Ionicons name="arrow-forward" size={18} color={colores.blanco} />
                </View>
            )}
            </TouchableOpacity>

            {/* ---- Separador "O CONTINUAR CON" ---- */}
            <View style={estilos.separador}>
            <View style={estilos.linea} />
            <Text style={estilos.separadorTexto}>O CONTINUAR CON</Text>
            <View style={estilos.linea} />
            </View>

            {/* ---- Botones sociales (aún sin backend) ---- */}
            <View style={estilos.filaSocial}>
            <TouchableOpacity style={estilos.botonSocial} onPress={() => noDisponible('El acceso con Google')}>
                <Ionicons name="logo-google" size={18} color={colores.texto} />
                <Text style={estilos.socialTexto}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.botonSocial} onPress={() => noDisponible('El acceso con Microsoft')}>
                <Ionicons name="logo-microsoft" size={18} color={colores.texto} />
                <Text style={estilos.socialTexto}>Microsoft</Text>
            </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
            <Text style={estilos.enlace}>
                ¿No tienes una cuenta? <Text style={estilos.enlaceFuerte}>Regístrate</Text>
            </Text>
            </TouchableOpacity>
            {/* Vuelve a la pantalla principal */}
            <TouchableOpacity onPress={() => navigation.navigate('Landing')}>
                <Text style={[estilos.enlace, { marginTop: 12 }]}>← Volver al inicio</Text>
            </TouchableOpacity>
        </View>
        </AuthLayout>
    );
}

const estilos = StyleSheet.create({
    tarjeta: {
        backgroundColor: colores.blanco, borderRadius: 20, padding: 32, paddingTop: 36,
        width: '100%', maxWidth: 420, alignSelf: 'center',
        overflow: 'hidden', // recorta la barra superior con las esquinas redondeadas
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    },
    barraSuperior: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },

    logo: { width: 96, height: 96, alignSelf: 'center', marginBottom: 4 },
    titulo: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: colores.texto },
    subtitulo: { textAlign: 'center', color: colores.textoSuave, marginTop: 4, marginBottom: 24 },

    etiqueta: { fontSize: 12, color: colores.textoSuave, marginBottom: 6, marginTop: 8, letterSpacing: 0.5 },
    filaEtiqueta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    olvido: { fontSize: 12, color: colores.texto, marginBottom: 6 },

    // Contenedor del campo: icono + input en una fila, con el borde en el contenedor
    campo: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: colores.borde, borderRadius: 10,
        paddingHorizontal: 12, backgroundColor: colores.fondo,
    },
    input: {
        flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 16, color: colores.texto,
        // En web, quitamos el recuadro azul por defecto del navegador al enfocar
        ...Platform.select({ web: { outlineStyle: 'none' } }),
    },

    error: {
        backgroundColor: colores.errorFondo, color: colores.error,
        padding: 10, borderRadius: 8, marginTop: 12,
    },
    aviso: {
        backgroundColor: '#E8F0FE', color: '#1A4FA0',
        padding: 10, borderRadius: 8, marginTop: 12,
    },

    boton: {
        backgroundColor: '#000', borderRadius: 10, padding: 15,
        alignItems: 'center', marginTop: 20,
    },
    botonContenido: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    botonTexto: { color: colores.blanco, fontWeight: '700', fontSize: 16 },

    separador: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
    linea: { flex: 1, height: 1, backgroundColor: colores.borde },
    separadorTexto: { marginHorizontal: 12, fontSize: 11, color: colores.textoSuave, letterSpacing: 0.8 },

    filaSocial: { flexDirection: 'row', gap: 12 },
    botonSocial: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: 1, borderColor: colores.borde, borderRadius: 10, paddingVertical: 12,
    },
    socialTexto: { color: colores.texto, fontWeight: '500' },

    enlace: { textAlign: 'center', marginTop: 24, color: colores.textoSuave },
    enlaceFuerte: { color: colores.texto, fontWeight: '700', textDecorationLine: 'underline' },
});