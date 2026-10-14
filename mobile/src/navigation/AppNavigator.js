import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colores } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';

// Stack = pila de pantallas: navegar a una la pone encima, goBack la quita
const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { usuario, cargando } = useAuth();

    // Mientras revisamos si hay una sesión guardada, mostramos un indicador de carga.
    // Así evitamos que se vea el login por un instante a quien ya tenía sesión.
    if (cargando) {
        return (
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colores.fondo }}>
            <ActivityIndicator size="large" color={colores.primario} />
        </View>
        );
    }

    return (
        <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {usuario ? (
            // Pantallas SOLO para usuarios con sesión (RNF04)
            <Stack.Screen name="Inicio" component={HomeScreen} />
            ) : (
            // Pantallas públicas. Al hacer login, "usuario" deja de ser null
            // y React cambia automáticamente al grupo de arriba.
            <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Registro" component={RegisterScreen} />
            </>
            )}
        </Stack.Navigator>
        </NavigationContainer>
    );
}