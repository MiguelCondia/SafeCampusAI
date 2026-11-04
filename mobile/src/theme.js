import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { guardar, obtener } from './services/storage';

// ---------- Paleta clara (la que ya usabas) + colores nuevos con nombre semántico ----------
export const claro = {
    fondo: '#F8F9FF',        // fondo de las pantallas
    superficie: '#FFFFFF',   // tarjetas, encabezados, campos
    oscuro: '#0B1530',       // chips activos, avatares, barras de gráficos
    primario: '#B8002A',
    verde: '#0F9D6B',
    texto: '#0B1530',
    textoSuave: '#5B6478',
    borde: '#D6DAE6',
    blanco: '#FFFFFF',       // SIEMPRE blanco: se usa para texto sobre botones de color
    error: '#C62828',
    errorFondo: '#FDE8E8',
    panelOscuro: '#0B1530',
    panelOscuro2: '#16264F',
    acento: '#5EE6A8',
    textoPanel: '#B8C0D8',
    botonNegro: '#000000',
    infoFondo: '#E8F0FE', infoTexto: '#1A4FA0',
    avisoFondo: '#FFF4E0', avisoTexto: '#B26A00',
    okFondo: '#E3F7EE', okTexto: '#0F7A55',
    peligroFondo: '#FDECEF',
    heroFondo: '#EEF2FF', tarjetaAzul: '#E6EEFF',
    separador: '#EEF0F6', pista: '#E8ECF4',
    placeholder: '#9AA2B5', neutroFondo: '#ECEFF3', moradoTexto: '#5E35B1',
    // Colores de las insignias de estado (RF08) y de prioridad (RF12)
    estado: {
        'Pendiente':   { fondo: '#FFF4E0', texto: '#B26A00' },
        'En revisión': { fondo: '#E8F0FE', texto: '#1A4FA0' },
        'En proceso':  { fondo: '#EDE7F6', texto: '#5E35B1' },
        'Resuelto':    { fondo: '#E3F7EE', texto: '#0F7A55' },
        'Cerrado':     { fondo: '#ECEFF3', texto: '#5B6478' },
    },
    prioridad: {
        'Crítico': { fondo: '#FDE8E8', texto: '#C62828' },
        'Alto':    { fondo: '#FFEBDD', texto: '#D35400' },
        'Medio':   { fondo: '#FFF8DB', texto: '#9A7B00' },
        'Bajo':    { fondo: '#E3F7EE', texto: '#0F7A55' },
    },
};

// ---------- Paleta oscura ----------
export const oscuro = {
    ...claro,
    fondo: '#0B1120',
    superficie: '#151B2E',
    oscuro: '#4A5C94',        // más claro que el fondo, para que se vea
    primario: '#E0345A',
    verde: '#34D399',
    texto: '#E8ECF8',
    textoSuave: '#9AA4C0',
    borde: '#2A3350',
    error: '#FF8A8A',
    errorFondo: '#3E1822',
    botonNegro: '#34427A',    // un "negro" sería invisible sobre fondo oscuro
    infoFondo: '#16264A', infoTexto: '#8FB4FF',
    avisoFondo: '#3A2A10', avisoTexto: '#FFB347',
    okFondo: '#0F3A2A', okTexto: '#5EE6A8',
    peligroFondo: '#3E1822',
    heroFondo: '#101A33', tarjetaAzul: '#16264A',
    separador: '#252C45', pista: '#252C45',
    placeholder: '#6F7A99', neutroFondo: '#252C45', moradoTexto: '#B39DFF',
    estado: {
        'Pendiente':   { fondo: '#3A2A10', texto: '#FFB347' },
        'En revisión': { fondo: '#16264A', texto: '#8FB4FF' },
        'En proceso':  { fondo: '#2A2150', texto: '#B39DFF' },
        'Resuelto':    { fondo: '#0F3A2A', texto: '#5EE6A8' },
        'Cerrado':     { fondo: '#252C45', texto: '#9AA4C0' },
    },
    prioridad: {
        'Crítico': { fondo: '#3E1822', texto: '#FF8A8A' },
        'Alto':    { fondo: '#3D2412', texto: '#FF9A5A' },
        'Medio':   { fondo: '#38300F', texto: '#F0C94A' },
        'Bajo':    { fondo: '#0F3A2A', texto: '#5EE6A8' },
    },
};

// Paleta ESTÁTICA (clara): sirve para constantes a nivel de módulo, que se
// calculan una sola vez. Dentro de los componentes se usa useTema().
export const colores = claro;

// ---------- Contexto del tema ----------
const TemaContext = createContext({ colores: claro, esOscuro: false, alternar: () => {} });

export function TemaProvider({ children }) {
    const sistema = useColorScheme();            // 'light', 'dark' o null
    const [preferencia, setPreferencia] = useState(null); // 'claro' | 'oscuro' | null (= seguir al sistema)

    // Al abrir la app, recuperamos la elección guardada
    useEffect(() => {
        obtener('tema')
        .then((v) => { if (v === 'claro' || v === 'oscuro') setPreferencia(v); })
        .catch(() => {});
    }, []);

    const esOscuro = preferencia ? preferencia === 'oscuro' : sistema === 'dark';

    const valor = useMemo(() => ({
        colores: esOscuro ? oscuro : claro,
        esOscuro,
        // Cambia al modo contrario y lo recuerda
        alternar: () => {
        const nuevo = esOscuro ? 'claro' : 'oscuro';
        setPreferencia(nuevo);
        guardar('tema', nuevo).catch(() => {});
        },
    }), [esOscuro]);

    return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

// Uso:  const { colores, esOscuro, alternar } = useTema();
export function useTema() {
    return useContext(TemaContext);
}

// Uso:  const estilos = useEstilos(crearEstilos);
// Recalcula los estilos solo cuando cambia el tema (no en cada render)
export function useEstilos(crear) {
    const { colores } = useTema();
    return useMemo(() => crear(colores), [colores]);
}