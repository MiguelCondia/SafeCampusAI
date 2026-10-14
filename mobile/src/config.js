import { Platform } from 'react-native';

// IP de TU computador en la red WiFi. El celular no entiende "localhost",
// porque para él localhost es el propio celular, no tu PC.
// Para saberla, ejecuta "ipconfig" y copia la "Dirección IPv4" (ej: 192.168.1.15).
// El celular y el PC deben estar en la MISMA red WiFi.
const IP_DEL_PC = '192.168.1.XX';

// En el navegador (web) sí podemos usar localhost.
// En celular físico usamos la IP del PC.
// (Si usas emulador de Android Studio, la IP sería 10.0.2.2)
export const API_URL =
    Platform.OS === 'web'
        ? 'http://localhost:3000/api'
        : `http://${IP_DEL_PC}:3000/api`;