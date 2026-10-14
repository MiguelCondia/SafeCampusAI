import React, { useCallback, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    ActivityIndicator, Linking, useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import TarjetaReporte from '../components/TarjetaReporte';
import { colores } from '../theme';

export default function PanelScreen({ navigation }) {
    const { usuario } = useAuth();
    const { width } = useWindowDimensions();
    const [reportes, setReportes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    const esAncho = width >= 900;
    const esAdmin = usuario.rol === 'administrador';

    // Se ejecuta cada vez que la pantalla recibe el foco (también al volver de crear un reporte)
    useFocusEffect(
        useCallback(() => {
        if (esAdmin) return; // el admin tendrá su propio panel en el Paso 7

        let activo = true; // evita actualizar el estado si la pantalla ya se cerró
        async function cargar() {
            try {
            const datos = await api('/reportes/mios');
            if (activo) { setReportes(datos); setError(''); }
            } catch (e) {
            if (activo) setError(e.message);
            } finally {
            if (activo) setCargando(false);
            }
        }
        cargar();
        return () => { activo = false; };
        }, [esAdmin])
    );

    // Aviso temporal para administradores
    if (esAdmin) {
        return (
        <View style={estilos.centro}>
            <Ionicons name="shield-checkmark" size={48} color={colores.verde} />
            <Text style={estilos.saludo}>Hola, {usuario.nombre}</Text>
            <Text style={[estilos.suave, { textAlign: 'center' }]}>
            El panel de administración (dashboard, mapa y gestión de reportes) se construye en el siguiente paso.
            </Text>
        </View>
        );
    }

    // ---- Cálculos para los contadores ----
    const total = reportes.length;
    const resueltos = reportes.filter((r) => r.estado === 'Resuelto').length;
    const activos = reportes.filter((r) => !['Resuelto', 'Cerrado'].includes(r.estado)).length;
    const pendientes = reportes.filter((r) => r.estado === 'Pendiente').length;
    // Porcentaje de resueltos para la barra (si no hay reportes, 0 para no dividir entre cero)
    const porcentaje = total ? Math.round((resueltos / total) * 100) : 0;

    const recientes = reportes.slice(0, 4); // el backend ya los entrega del más nuevo al más antiguo

    return (
        <ScrollView contentContainerStyle={estilos.contenedor}>
        {/* ---- Saludo + botón principal ---- */}
        <View style={estilos.filaSaludo}>
            <View>
            <Text style={estilos.etiquetaPortal}>PORTAL ESTUDIANTIL</Text>
            <Text style={estilos.saludo}>Hola, {usuario.nombre.split(' ')[0]}</Text>
            </View>
            <TouchableOpacity style={estilos.botonCrear} onPress={() => navigation.navigate('NuevoReporte')}>
            <Ionicons name="add-circle-outline" size={20} color={colores.blanco} />
            <Text style={estilos.botonCrearTexto}>Crear nuevo reporte</Text>
            </TouchableOpacity>
        </View>

        {/* ---- Banner de estado (estático por ahora) ---- */}
        <View style={estilos.banner}>
            <View style={estilos.bannerIcono}>
            <Ionicons name="shield-checkmark" size={22} color={colores.primario} />
            </View>
            <View style={{ flex: 1 }}>
            <Text style={estilos.bannerTitulo}>Estado del campus: Normal y protegido</Text>
            <Text style={estilos.suave}>Tus reportes se gestionan y se les hace seguimiento aquí</Text>
            </View>
        </View>

        {/* ---- Contadores ---- */}
        <View style={estilos.filaStats}>
            <View style={estilos.stat}>
            <Text style={estilos.statEtiqueta}>Reportes activos</Text>
            <Text style={estilos.statNumero}>{cargando ? '–' : activos}</Text>
            <Text style={estilos.statPie}>{cargando ? ' ' : `${pendientes} pendientes`}</Text>
            </View>

            <View style={estilos.stat}>
            <Text style={estilos.statEtiqueta}>Resueltos</Text>
            <Text style={estilos.statNumero}>{cargando ? '–' : resueltos}</Text>
            {/* Barra de progreso: ancho = porcentaje de reportes resueltos */}
            <View style={estilos.barraFondo}>
                <View style={[estilos.barraRelleno, { width: `${porcentaje}%` }]} />
            </View>
            </View>

            <View style={estilos.stat}>
            <Text style={estilos.statEtiqueta}>Total</Text>
            <Text style={estilos.statNumero}>{cargando ? '–' : total}</Text>
            <Text style={estilos.statPie}>reportes creados</Text>
            </View>
        </View>

        {/* ---- Dos columnas en pantallas anchas; una sola columna en el celular ---- */}
        <View style={[estilos.columnas, esAncho && { flexDirection: 'row', alignItems: 'flex-start', gap: 24 }]}>
            {/* Columna izquierda: reportes */}
            <View style={esAncho ? { flex: 2 } : null}>
            <View style={estilos.encabezado}>
                <Text style={estilos.seccion}>Mis reportes y seguimiento</Text>
                <TouchableOpacity onPress={() => navigation.navigate('MisReportes')}>
                <Text style={estilos.verTodos}>Ver todos</Text>
                </TouchableOpacity>
            </View>

            {cargando && <ActivityIndicator color={colores.primario} style={{ marginTop: 16 }} />}
            {error ? <Text style={estilos.error}>{error}</Text> : null}
            {!cargando && !error && recientes.length === 0 && (
                <Text style={estilos.vacio}>Aún no has creado reportes.</Text>
            )}

            {recientes.map((r) => (
                <TarjetaReporte
                key={r.id_reporte}
                reporte={r}
                onPress={() => navigation.navigate('DetalleReporte', { id: r.id_reporte })}
                />
            ))}
            </View>

            {/* Columna derecha: contactos */}
            <View style={esAncho ? { flex: 1 } : null}>
            <Text style={[estilos.seccion, { marginTop: 24, marginBottom: 10 }]}>Contactos rápidos</Text>
            <View style={estilos.tarjetaContactos}>
                <View style={estilos.filaContacto}>
                <Text style={estilos.contactoNombre}>Brigada médica</Text>
                <Text style={estilos.ext}>Ext. 101</Text>
                </View>
                <View style={estilos.filaContacto}>
                <Text style={estilos.contactoNombre}>Mantenimiento</Text>
                <Text style={estilos.ext}>Ext. 104</Text>
                </View>
                <View style={estilos.filaContacto}>
                <Text style={[estilos.contactoNombre, { color: colores.primario, fontWeight: '700' }]}>Seguridad central</Text>
                <Text style={[estilos.ext, { color: colores.primario }]}>Línea 123</Text>
                </View>

                {/* Linking.openURL('tel:...') abre el marcador del celular con el número listo */}
                <TouchableOpacity
                style={estilos.botonSOS}
                onPress={() => Linking.openURL('tel:123').catch(() => {})}
                >
                <Ionicons name="call" size={18} color={colores.blanco} />
                <Text style={estilos.botonSOSTexto}>Línea SOS universitaria</Text>
                </TouchableOpacity>
            </View>
            </View>
        </View>
        </ScrollView>
    );
}

const estilos = StyleSheet.create({
    contenedor: { padding: 20, paddingBottom: 48, maxWidth: 1100, width: '100%', alignSelf: 'center' },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
    suave: { color: colores.textoSuave, fontSize: 13 },
    error: { backgroundColor: colores.errorFondo, color: colores.error, padding: 10, borderRadius: 8, marginTop: 12 },
    vacio: { textAlign: 'center', color: colores.textoSuave, marginTop: 24 },

    // flexWrap deja que el botón baje debajo del saludo si no cabe (celular)
    filaSaludo: {
        flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
        alignItems: 'center', gap: 12,
    },
    etiquetaPortal: { fontSize: 11, letterSpacing: 1, color: colores.textoSuave },
    saludo: { fontSize: 28, fontWeight: '800', color: colores.texto },
    botonCrear: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: colores.primario, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12,
    },
    botonCrearTexto: { color: colores.blanco, fontWeight: '700' },

    banner: {
        flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18,
        backgroundColor: colores.blanco, borderRadius: 14, padding: 14,
    },
    bannerIcono: {
        width: 42, height: 42, borderRadius: 10, backgroundColor: '#E8F0FE',
        alignItems: 'center', justifyContent: 'center',
    },
    bannerTitulo: { fontWeight: '700', color: colores.texto, fontSize: 15 },

    filaStats: { flexDirection: 'row', gap: 10, marginTop: 14 },
    stat: { flex: 1, backgroundColor: colores.blanco, borderRadius: 14, padding: 14 },
    statEtiqueta: { color: colores.textoSuave, fontSize: 12 },
    statNumero: { fontSize: 32, fontWeight: '800', color: colores.texto, marginTop: 4 },
    statPie: { color: colores.textoSuave, fontSize: 12, marginTop: 2 },
    barraFondo: { height: 6, borderRadius: 3, backgroundColor: '#E3E7F0', marginTop: 10, overflow: 'hidden' },
    barraRelleno: { height: 6, backgroundColor: colores.verde },

    columnas: { marginTop: 8 },
    encabezado: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 24, marginBottom: 12,
    },
    seccion: { fontSize: 20, fontWeight: '800', color: colores.texto },
    verTodos: { color: colores.primario, fontWeight: '700' },

    tarjetaContactos: { backgroundColor: colores.blanco, borderRadius: 14, padding: 16 },
    filaContacto: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    contactoNombre: { color: colores.texto },
    ext: { fontWeight: '700', color: colores.texto },
    botonSOS: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: colores.primario, borderRadius: 10, padding: 13, marginTop: 12,
    },
    botonSOSTexto: { color: colores.blanco, fontWeight: '700' },
});