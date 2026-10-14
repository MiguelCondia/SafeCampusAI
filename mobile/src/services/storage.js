import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// SecureStore guarda datos cifrados en el celular, pero NO existe en el navegador.
// Por eso, en web usamos localStorage. Así el mismo código funciona en ambos.

export async function guardar(clave, valor) {
    if (Platform.OS === 'web') {
        localStorage.setItem(clave, valor);
    } else {
        await SecureStore.setItemAsync(clave, valor);
    }
}

export async function obtener(clave) {
    if (Platform.OS === 'web') {
        return localStorage.getItem(clave);
    }
    return SecureStore.getItemAsync(clave);
}

export async function borrar(clave) {
    if (Platform.OS === 'web') {
        localStorage.removeItem(clave);
    } else {
        await SecureStore.deleteItemAsync(clave);
    }
}