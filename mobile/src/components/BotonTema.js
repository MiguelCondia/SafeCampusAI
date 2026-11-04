import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../theme';

// Muestra la luna en modo claro y el sol en modo oscuro
export default function BotonTema({ color }) {
    const { colores, esOscuro, alternar } = useTema();
    return (
        <TouchableOpacity
            onPress={alternar}
            accessibilityLabel={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            style={{ padding: 6 }}
        >
        <Ionicons name={esOscuro ? 'sunny-outline' : 'moon-outline'} size={22} color={color || colores.texto} />
        </TouchableOpacity>
    );
}