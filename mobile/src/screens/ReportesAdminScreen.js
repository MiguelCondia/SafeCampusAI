import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import TarjetaReporte from '../components/TarjetaReporte';
import { colores } from '../theme';

const PRIORIDADES = ['Crítico', 'Alto', 'Medio', 'Bajo'];
const BLOQUES = ['Bloque A', 'Bloque B', 'Bloque C', 'Biblioteca Central', 'Cafetería', 'Gimnasio'];

// Fila de chips reutilizable. Tocar el chip activo lo desactiva (quita el filtro)
function FiltroChips({ titulo, opciones, valor, onCambio }) {
    return (
        <View style={{ marginTop: 10 }}>
        <Text style={estilos.etiqueta}>{titulo}</Text>
        {/* ScrollView horizontal: si hay muchos chips se desliza de lado en vez de desbordar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {opciones.map((o) => {
            const activo = valor === o.valor;
            return (
                <TouchableOpacity
                key={String(o.valor)}
                style={[estilos.chip, activo && estilos.chipActivo]}
                onPress={() => onCambio(activo ? null : o.valor)}
                >
                <Text style={[estilos.chipTexto, activo && estilos.chipTextoActivo]}>{o.etiqueta}</Text>
                </TouchableOpacity>
            );
            })}
        </ScrollView>
        </View>
    );
}

export default function ReportesAdminScreen({ navigation }) {
    const [reportes, setReportes] = useState([]);
    const [estados, setEstados] = useState([]);       // catálogo, para los chips de estado
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    // Filtros activos (null = sin filtrar). Corresponden a los parámetros del backend (RF14)
    const [fEstado, setFEstado] = useState(null);
    const [fPrioridad, setFPrioridad] = useState(null);
    const [fBloque, setFBloque] = useState(null);

    // Los estados se cargan una sola vez
    useEffect(() => {
        api('/catalogos').then((d) => setEstados(d.estados)).catch(() => {});
    }, []);

    // Se recarga al enfocar la pantalla Y cada vez que cambia algún filtro
    useFocusEffect(
        useCallback(() => {
        let activo = true;

        // Armamos el query string solo con los filtros que tienen valor
        const partes = [];
        if (fEstado) partes.push(`estado=${fEstado}`);
        if (fPrioridad) partes.push(`prioridad=${encodeURIComponent(fPrioridad)}`);
        if (fBloque) partes.push(`bloque=${encodeURIComponent(fBloque)}`);
        const consulta = partes.length ? `?${partes.join('&')}` : '';

        setCargando(true);
        api(`/reportes${consulta}`)
            .then((d) => { if (activo) { setReportes(d); setError(''); } })
            .catch((e) => { if (activo) setError(e.message); })
            .finally(() => { if (activo) setCargando(false); });

        return () => { activo = false; };
        }, [fEstado, fPrioridad, fBloque])
    );

    const hayFiltros = fEstado || fPrioridad || fBloque;

    return (
        <FlatList
        data={reportes}
        keyExtractor={(r) => String(r.id_reporte)}
        contentContainerStyle={estilos.contenedor}
        // Los filtros van como encabezado de la lista para que se desplacen con ella
        ListHeaderComponent={
            <View>
            <Text style={estilos.titulo}>Todos los reportes</Text>
            <FiltroChips
                titulo="ESTADO"
                opciones={estados.map((e) => ({ valor: e.id_estado, etiqueta: e.nombre }))}
                valor={fEstado}
                onCambio={setFEstado}
            />
            <FiltroChips
                titulo="PRIORIDAD"
                opciones={PRIORIDADES.map((p) => ({ valor: p, etiqueta: p }))}
                valor={fPrioridad}
                onCambio={setFPrioridad}
            />
            <FiltroChips
                titulo="ZONA"
                opciones={BLOQUES.map((b) => ({ valor: b, etiqueta: b }))}
                valor={fBloque}
                onCambio={setFBloque}
            />

            <View style={estilos.filaResumen}>
                <Text style={estilos.suave}>{cargando ? 'Cargando...' : `${reportes.length} reporte(s)`}</Text>
                {hayFiltros ? (
                <TouchableOpacity onPress={() => { setFEstado(null); setFPrioridad(null); setFBloque(null); }}>
                    <Text style={estilos.limpiar}>Limpiar filtros</Text>
                </TouchableOpacity>
                ) : null}
            </View>
            {error ? <Text style={estilos.error}>{error}</Text> : null}
            {cargando && <ActivityIndicator color={colores.primario} />}
            </View>
        }
        ListEmptyComponent={!cargando && !error ? <Text style={estilos.vacio}>No hay reportes con esos filtros.</Text> : null}
        renderItem={({ item }) => (
            <TarjetaReporte
            reporte={item}
            admin
            onPress={() => navigation.navigate('DetalleReporte', { id: item.id_reporte })}
            />
        )}
        />
    );
}

const estilos = StyleSheet.create({
    contenedor: { padding: 20, paddingBottom: 48, maxWidth: 900, width: '100%', alignSelf: 'center' },
    titulo: { fontSize: 26, fontWeight: '800', color: colores.texto },
    etiqueta: { fontSize: 11, letterSpacing: 0.8, color: colores.textoSuave, marginBottom: 6 },
    suave: { color: colores.textoSuave },
    vacio: { textAlign: 'center', color: colores.textoSuave, marginTop: 30 },
    error: { backgroundColor: colores.errorFondo, color: colores.error, padding: 10, borderRadius: 8, marginTop: 8 },

    chip: {
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, marginRight: 8,
        borderWidth: 1, borderColor: colores.borde, backgroundColor: colores.blanco,
    },
    chipActivo: { backgroundColor: colores.oscuro, borderColor: colores.oscuro },
    chipTexto: { color: colores.texto, fontSize: 13 },
    chipTextoActivo: { color: colores.blanco, fontWeight: '700' },

    filaResumen: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 14 },
    limpiar: { color: colores.primario, fontWeight: '700' },
});