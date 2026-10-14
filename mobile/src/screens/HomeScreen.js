import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colores } from '../theme';

export default function HomeScreen() {
    const { usuario, logout } = useAuth();

    // Mostramos el rol para comprobar que el backend lo reconoce correctamente
    const esAdmin = usuario.rol === 'administrador';

    return (
        <View style={estilos.contenedor}>
        <Text style={estilos.saludo}>Hola, {usuario.nombre}</Text>
        <Text style={estilos.rol}>
            Rol: {esAdmin ? 'Administrador' : 'Estudiante'}
        </Text>
        <Text style={estilos.nota}>
            Sesión iniciada correctamente. Aquí irá el panel principal.
        </Text>

        <TouchableOpacity style={estilos.boton} onPress={logout}>
            <Text style={estilos.botonTexto}>Cerrar sesión</Text>
        </TouchableOpacity>
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colores.fondo },
    saludo: { fontSize: 26, fontWeight: '800', color: colores.texto },
    rol: { marginTop: 6, color: colores.verde, fontWeight: '700' },
    nota: { marginTop: 16, color: colores.textoSuave },
    boton: {
        backgroundColor: colores.primario, borderRadius: 10, padding: 14,
        alignItems: 'center', marginTop: 28,
    },
    botonTexto: { color: colores.blanco, fontWeight: '700' },
});