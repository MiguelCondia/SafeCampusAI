import React from 'react';
import {
    View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions,
} from 'react-native';
// Hooks para saber en qué pantalla estamos y poder navegar desde el layout
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colores } from '../theme';

// Opciones del menú. Cuando hagamos el mapa (Paso 7B) solo habrá que agregar un ítem aquí
const NAV = [
    { etiqueta: 'Dashboard', ruta: 'Panel', icono: 'home-outline' },
    { etiqueta: 'Reportes', ruta: 'ReportesAdmin', icono: 'document-text-outline' },
];

// "children" es la pantalla que se muestra a la derecha de la barra lateral
export default function AdminLayout({ children }) {
    const navigation = useNavigation();
    const route = useRoute();
    const { usuario, logout } = useAuth();
    const insets = useSafeAreaInsets(); // espacio seguro arriba en el celular (en web es 0)
    const { width } = useWindowDimensions();

    const esAncho = width >= 900; // desde 900px mostramos la barra lateral

    // El detalle de un reporte "pertenece" a la sección Reportes: la resaltamos en el menú
    const rutaActiva = route.name === 'DetalleReporte' ? 'ReportesAdmin' : route.name;

    const inicial = usuario.nombre.charAt(0).toUpperCase();

    // ---------- Versión celular: barra superior oscura + enlaces en fila ----------
    if (!esAncho) {
        return (
        <View style={estilos.raiz}>
            <View style={[estilos.barraMovil, { paddingTop: insets.top + 10 }]}>
            <View style={estilos.filaMovil}>
                {/* Flecha de volver: solo si hay una pantalla anterior (ej: el detalle) */}
                {navigation.canGoBack() && (
                <TouchableOpacity onPress={navigation.goBack} style={{ marginRight: 8 }}>
                    <Ionicons name="chevron-back" size={24} color={colores.blanco} />
                </TouchableOpacity>
                )}
                <Image source={require('../../assets/logo.png')} style={estilos.logoChico} resizeMode="contain" />
                <Text style={estilos.marcaMovil}>SafeCampus IA</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={logout}>
                <Ionicons name="log-out-outline" size={22} color={colores.acento} />
                </TouchableOpacity>
            </View>

            <View style={estilos.filaEnlaces}>
                {NAV.map((n) => {
                const activo = rutaActiva === n.ruta;
                return (
                    <TouchableOpacity
                    key={n.ruta}
                    style={[estilos.pildora, activo && estilos.pildoraActiva]}
                    onPress={() => navigation.navigate(n.ruta)}
                    >
                    <Text style={[estilos.pildoraTexto, activo && estilos.pildoraTextoActivo]}>{n.etiqueta}</Text>
                    </TouchableOpacity>
                );
                })}
            </View>
            </View>
            <View style={{ flex: 1 }}>{children}</View>
        </View>
        );
    }

    // ---------- Versión escritorio: barra lateral + contenido ----------
    return (
        <View style={[estilos.raiz, { flexDirection: 'row' }]}>
        <View style={estilos.lateral}>
            {/* Marca */}
            <View style={estilos.marca}>
            <Image source={require('../../assets/logo.png')} style={estilos.logo} resizeMode="contain" />
            <View style={{ flex: 1 }}>
                <View style={estilos.filaMarca}>
                <Text style={estilos.marcaTexto}>SafeCampus</Text>
                <View style={estilos.chipAI}><Text style={estilos.chipAITexto}>AI</Text></View>
                </View>
                <Text style={estilos.marcaSub}>Gestión de riesgos universitarios</Text>
            </View>
            </View>

            {/* Tarjeta de perfil del administrador */}
            <View style={estilos.perfil}>
            <View style={estilos.avatar}><Text style={estilos.avatarTexto}>{inicial}</Text></View>
            <View style={{ flex: 1 }}>
                <Text style={estilos.perfilNombre} numberOfLines={1}>{usuario.nombre}</Text>
                <Text style={estilos.perfilCorreo} numberOfLines={1}>{usuario.correo || 'Administrador'}</Text>
                <View style={estilos.filaEnLinea}>
                <View style={estilos.puntoVerde} />
                <Text style={estilos.enLinea}>En línea</Text>
                </View>
            </View>
            </View>

            <Text style={estilos.seccion}>PANEL PRINCIPAL</Text>
            {NAV.map((n) => {
            const activo = rutaActiva === n.ruta;
            return (
                <TouchableOpacity
                key={n.ruta}
                style={[estilos.item, activo && estilos.itemActivo]}
                onPress={() => navigation.navigate(n.ruta)}
                >
                <Ionicons name={n.icono} size={20} color={activo ? colores.acento : '#B8C0D8'} />
                <Text style={[estilos.itemTexto, activo && estilos.itemTextoActivo]}>{n.etiqueta}</Text>
                </TouchableOpacity>
            );
            })}

            {/* flex:1 empuja "Cerrar sesión" hasta el fondo de la barra */}
            <View style={{ flex: 1 }} />
            <View style={estilos.separador} />
            <TouchableOpacity style={estilos.item} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#B8C0D8" />
            <Text style={estilos.itemTexto}>Cerrar sesión</Text>
            </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>{children}</View>
        </View>
    );
}

const estilos = StyleSheet.create({
    raiz: { flex: 1, backgroundColor: colores.fondo },

    // ----- Escritorio -----
    lateral: { width: 260, backgroundColor: '#0B1120', padding: 16 },
    marca: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, marginBottom: 14 },
    logo: { width: 42, height: 42, borderRadius: 10 },
    filaMarca: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    marcaTexto: { color: colores.blanco, fontWeight: '800', fontSize: 17 },
    chipAI: { backgroundColor: 'rgba(94,230,168,0.18)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
    chipAITexto: { color: colores.acento, fontSize: 10, fontWeight: '800' },
    marcaSub: { color: '#8C96B3', fontSize: 12, marginTop: 2 },

    perfil: {
        flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    avatar: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B4A7A',
        alignItems: 'center', justifyContent: 'center',
    },
    avatarTexto: { color: colores.blanco, fontWeight: '800', fontSize: 16 },
    perfilNombre: { color: colores.blanco, fontWeight: '700', fontSize: 14 },
    perfilCorreo: { color: '#8C96B3', fontSize: 12 },
    filaEnLinea: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    puntoVerde: { width: 7, height: 7, borderRadius: 4, backgroundColor: colores.acento },
    enLinea: { color: colores.acento, fontSize: 11 },

    seccion: { color: '#6F7A99', fontSize: 11, letterSpacing: 1, marginTop: 24, marginBottom: 8, marginLeft: 8 },
    item: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4,
    },
    // El ítem activo lleva fondo verdoso y una barra de color a la izquierda, como el mockup
    itemActivo: {
        backgroundColor: 'rgba(94,230,168,0.12)', borderLeftWidth: 3, borderLeftColor: colores.acento,
    },
    itemTexto: { color: '#B8C0D8', fontWeight: '600', fontSize: 15 },
    itemTextoActivo: { color: colores.acento },
    separador: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 8 },

    // ----- Celular -----
    barraMovil: { backgroundColor: '#0B1120', paddingHorizontal: 16, paddingBottom: 12 },
    filaMovil: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logoChico: { width: 30, height: 30, borderRadius: 8 },
    marcaMovil: { color: colores.blanco, fontWeight: '800', fontSize: 17 },
    filaEnlaces: { flexDirection: 'row', gap: 8, marginTop: 12 },
    pildora: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
    pildoraActiva: { backgroundColor: 'rgba(94,230,168,0.18)' },
    pildoraTexto: { color: '#B8C0D8', fontWeight: '600', fontSize: 13 },
    pildoraTextoActivo: { color: colores.acento },
});