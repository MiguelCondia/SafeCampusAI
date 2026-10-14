import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { guardar, obtener, borrar } from '../services/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);     // null = sin sesión
    const [cargando, setCargando] = useState(true);   // true mientras revisamos si hay sesión guardada

    // Al abrir la app: si hay un token guardado, preguntamos al backend
    // quién es (GET /auth/me). Si el token venció o es inválido, lo descartamos.
    useEffect(() => {
        async function restaurarSesion() {
        try {
            const token = await obtener('token');
            if (token) {
            const perfil = await api('/auth/me');
            setUsuario(perfil);
            }
        } catch (e) {
            await borrar('token'); // token inválido o servidor caído: empezamos sin sesión
        } finally {
            setCargando(false);
        }
        }
        restaurarSesion();
    }, []); // [] = se ejecuta solo una vez, al montar el componente

    // Iniciar sesión: guardamos el token y el usuario
    async function login(correo, contrasena) {
        const datos = await api('/auth/login', {
        metodo: 'POST',
        cuerpo: { correo, contrasena },
        });
        await guardar('token', datos.token);
        setUsuario(datos.usuario);
    }

    // Registrarse: el backend devuelve también un token, así que entra directo
    async function registrar(nombre, correo, contrasena, telefono) {
        const datos = await api('/auth/registro', {
        metodo: 'POST',
        cuerpo: { nombre, correo, contrasena, telefono },
        });
        await guardar('token', datos.token);
        setUsuario(datos.usuario);
    }

    // Cerrar sesión (RF02): borramos el token y el usuario
    async function logout() {
        await borrar('token');
        setUsuario(null);
    }

    return (
        <AuthContext.Provider value={{ usuario, cargando, login, registrar, logout }}>
        {children}
        </AuthContext.Provider>
    );
}

// Hook para usar el contexto en cualquier pantalla:  const { usuario, login } = useAuth();
export function useAuth() {
    return useContext(AuthContext);
}