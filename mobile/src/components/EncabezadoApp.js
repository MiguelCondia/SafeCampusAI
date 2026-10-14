import React from 'react';
import {
    View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions,
} from 'react-native';
// Da el espacio seguro arriba (notch / barra de estado del celular). En web es 0
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colores } from '../theme';

// Enlaces de navegación (solo para estudiantes). "ruta" es el nombre de la pantalla en el navegador
const ENLACES = [
    { etiqueta: 'Mi Panel', ruta: 'Panel' },
    { etiqueta: 'Mis Reportes', ruta: 'MisReportes' },
];

// React Navigation entrega a un encabezado personalizado estas props:
//   navigation: para navegar | route: la pantalla actual | back: existe si hay a dónde volver
export default function EncabezadoApp({ navigation, route, back }) {
    const { usuario, logout } = useAuth();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const esAncho = width >= 900;
    const esAdmin = usuario.rol === 'administrador';
    const inicial = usuario.nombre.charAt(0).toUpperCase(); // letra para el avatar

    return (
        // paddingTop suma el espacio seguro para que el encabezado no quede bajo la barra de estado
        <View style={[estilos.barra, { paddingTop: insets.top + 8 }]}>
        <View style={estilos.fila}>
            {/* ---- Izquierda: volver (solo celular) + logo ---- */}
            <View style={estilos.grupo}>
            {back && !esAncho && (
                <TouchableOpacity onPress={navigation.goBack} style={estilos.volver}>
                <Ionicons name="chevron-back" size={24} color={colores.texto} />
                </TouchableOpacity>
            )}
            <TouchableOpacity style={estilos.grupo} onPress={() => navigation.navigate('Panel')}>
                <Image source={require('../../assets/logo.png')} style={estilos.logo} resizeMode="contain" />
                <Text style={estilos.marca}>SafeCampus IA</Text>
            </TouchableOpacity>
            </View>

            {/* ---- Centro: enlaces (solo pantallas anchas y estudiantes) ---- */}
            {esAncho && !esAdmin && (
            <View style={estilos.grupo}>
                {ENLACES.map((e) => {
                const activo = route.name === e.ruta; // resaltamos el enlace de la pantalla actual
                return (
                    <TouchableOpacity key={e.ruta} onPress={() => navigation.navigate(e.ruta)}>
                    <Text style={[estilos.enlace, activo && estilos.enlaceActivo]}>{e.etiqueta}</Text>
                    </TouchableOpacity>
                );
                })}
            </View>
            )}

            {/* ---- Derecha: crear reporte (ancho) + usuario + salir ---- */}
            <View style={estilos.grupo}>
            {esAncho && !esAdmin && (
                <TouchableOpacity style={estilos.botonCrear} onPress={() => navigation.navigate('NuevoReporte')}>
                <Ionicons name="add" size={16} color={colores.blanco} />
                <Text style={estilos.botonCrearTexto}>Crear Reporte</Text>
                </TouchableOpacity>
            )}

            {/* Nombre y rol: solo si hay espacio */}
            {esAncho && (
                <View style={{ alignItems: 'flex-end' }}>
                <Text style={estilos.usuarioNombre}>{usuario.nombre}</Text>
                <Text style={estilos.usuarioRol}>{esAdmin ? 'Administrador' : 'Estudiante'}</Text>
                </View>
            )}

            {/* Avatar con la inicial (no tenemos fotos de perfil) */}
            <View style={estilos.avatar}>
                <Text style={estilos.avatarTexto}>{inicial}</Text>
            </View>

            <TouchableOpacity onPress={logout} style={estilos.salir}>
                <Ionicons name="log-out-outline" size={22} color={colores.primario} />
            </TouchableOpacity>
            </View>
        </View>
        </View>
    );
}

const estilos = StyleSheet.create({
    barra: {
        backgroundColor: colores.blanco, paddingBottom: 10, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: colores.borde,
    },
    // space-between reparte izquierda / centro / derecha a lo ancho
    fila: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: 1100, width: '100%', alignSelf: 'center',
    },
    grupo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    volver: { marginLeft: -6 },

    logo: { width: 32, height: 32 },
    marca: { fontSize: 18, fontWeight: '800', color: colores.texto },

    enlace: { color: colores.textoSuave, fontWeight: '600', fontSize: 14 },
    enlaceActivo: { color: colores.primario },

    botonCrear: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: colores.primario, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8,
    },
    botonCrearTexto: { color: colores.blanco, fontWeight: '700', fontSize: 14 },

    usuarioNombre: { fontWeight: '700', color: colores.texto, fontSize: 13 },
    usuarioRol: { color: colores.textoSuave, fontSize: 11 },

    avatar: {
        width: 34, height: 34, borderRadius: 17, backgroundColor: colores.oscuro,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarTexto: { color: colores.blanco, fontWeight: '800' },
    salir: { padding: 4 },
});