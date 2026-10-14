import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colores } from '../theme';
import EncabezadoApp from '../components/EncabezadoApp'; // NUEVO

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PanelScreen from '../screens/PanelScreen';
import NuevoReporteScreen from '../screens/NuevoReporteScreen';
import MisReportesScreen from '../screens/MisReportesScreen';
import DetalleReporteScreen from '../screens/DetalleReporteScreen';

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

    return (
        <NavigationContainer>
        <Stack.Navigator
            screenOptions={{
            // NUEVO: "header" reemplaza el encabezado por defecto por nuestro componente.
            // Recibe navigation, route y back, que le pasamos tal cual con {...props}
            header: (props) => <EncabezadoApp {...props} />,
            contentStyle: { backgroundColor: colores.fondo },
            }}
        >
            {usuario ? (
            <>
                <Stack.Screen name="Panel" component={PanelScreen} />
                <Stack.Screen name="NuevoReporte" component={NuevoReporteScreen} />
                <Stack.Screen name="MisReportes" component={MisReportesScreen} />
                <Stack.Screen name="DetalleReporte" component={DetalleReporteScreen} />
            </>
            ) : (
            <>
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Registro" component={RegisterScreen} options={{ headerShown: false }} />
            </>
            )}
        </Stack.Navigator>
        </NavigationContainer>
    );
}