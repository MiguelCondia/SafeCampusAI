import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colores } from '../theme';
import EncabezadoApp from '../components/EncabezadoApp';
import conLayoutAdmin from '../components/conLayoutAdmin'; // NUEVO
import MapaRiesgosScreen from '../screens/MapaRiesgosScreen';

// Pantallas públicas (sin sesión)
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Pantallas del estudiante
import PanelScreen from '../screens/PanelScreen';
import NuevoReporteScreen from '../screens/NuevoReporteScreen';
import MisReportesScreen from '../screens/MisReportesScreen';

// Pantallas del administrador
import PanelAdminScreen from '../screens/PanelAdminScreen';
import ReportesAdminScreen from '../screens/ReportesAdminScreen';

// Pantalla compartida: el admin ve además el panel de gestión
import DetalleReporteScreen from '../screens/DetalleReporteScreen';

// NUEVO: versiones de las pantallas del admin ya envueltas en la barra lateral.
// Se crean AQUÍ, fuera del componente, a propósito: si se crearan dentro,
// React las trataría como pantallas nuevas en cada render y las reiniciaría.
const PanelAdmin = conLayoutAdmin(PanelAdminScreen);
const ReportesAdmin = conLayoutAdmin(ReportesAdminScreen);
const DetalleAdmin = conLayoutAdmin(DetalleReporteScreen);
const MapaRiesgos = conLayoutAdmin(MapaRiesgosScreen);

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { usuario, cargando } = useAuth();

    if (cargando) {
        return (
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colores.fondo }}>
            <ActivityIndicator size="large" color={colores.primario} />
        </View>
        );
    }

    const esAdmin = usuario && usuario.rol === 'administrador';

    return (
        <NavigationContainer>
        <Stack.Navigator
            screenOptions={{
            // Encabezado propio para las pantallas del estudiante
            header: (props) => <EncabezadoApp {...props} />,
            contentStyle: { backgroundColor: colores.fondo },
            }}
        >
            {!usuario ? (
            // ---- Sin sesión: login y registro, cada uno con su diseño ----
            <>
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Registro" component={RegisterScreen} options={{ headerShown: false }} />
            </>
            ) : esAdmin ? (
            // ---- Administrador: sin encabezado (lo reemplaza la barra lateral).
            // animation:'none' evita que la barra lateral "se deslice" al cambiar de sección ----
            <Stack.Group screenOptions={{ headerShown: false, animation: 'none' }}>
                <Stack.Screen name="Panel" component={PanelAdmin} />
                <Stack.Screen name="ReportesAdmin" component={ReportesAdmin} />
                <Stack.Screen name="DetalleReporte" component={DetalleAdmin} />
                <Stack.Screen name="MapaRiesgos" component={MapaRiesgos} />
            </Stack.Group>
            ) : (
            // ---- Estudiante ----
            <>
                <Stack.Screen name="Panel" component={PanelScreen} />
                <Stack.Screen name="NuevoReporte" component={NuevoReporteScreen} />
                <Stack.Screen name="MisReportes" component={MisReportesScreen} />
                <Stack.Screen name="DetalleReporte" component={DetalleReporteScreen} />
            </>
            )}
        </Stack.Navigator>
        </NavigationContainer>
    );
}