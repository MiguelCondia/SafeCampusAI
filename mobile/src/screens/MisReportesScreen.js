import React, { useCallback, useState } from 'react';
import { Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import TarjetaReporte from '../components/TarjetaReporte';
import { colores } from '../theme';

export default function MisReportesScreen({ navigation }) {
    const [reportes, setReportes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [error, setError] = useState('');

    async function cargar() {
        try {
        setReportes(await api('/reportes/mios'));
        setError('');
        } catch (e) {
        setError(e.message);
        } finally {
        setCargando(false);
        setRefrescando(false);
        }
    }

    useFocusEffect(useCallback(() => { cargar(); }, []));

    if (cargando) {
        return <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colores.primario} />;
    }

    return (
        <FlatList
        data={reportes}
        keyExtractor={(r) => String(r.id_reporte)}
        contentContainerStyle={estilos.contenedor}
        refreshing={refrescando}
        onRefresh={() => { setRefrescando(true); cargar(); }}
        ListHeaderComponent={error ? <Text style={estilos.error}>{error}</Text> : null}
        ListEmptyComponent={!error ? <Text style={estilos.vacio}>Aún no has creado reportes.</Text> : null}
        // La tarjeta compartida hace todo el trabajo visual: aquí solo le pasamos los datos
        renderItem={({ item }) => (
            <TarjetaReporte
            reporte={item}
            onPress={() => navigation.navigate('DetalleReporte', { id: item.id_reporte })}
            />
        )}
        />
    );
}

const estilos = StyleSheet.create({
    contenedor: { padding: 20, maxWidth: 720, width: '100%', alignSelf: 'center' },
    vacio: { textAlign: 'center', color: colores.textoSuave, marginTop: 40 },
    error: { backgroundColor: colores.errorFondo, color: colores.error, padding: 10, borderRadius: 8, marginBottom: 12 },
});