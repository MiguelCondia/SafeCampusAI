import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { TemaProvider, useTema } from './src/theme';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Componente interno: necesita estar DENTRO del TemaProvider para leer el tema
function Raiz() {
  const { esOscuro } = useTema();
  return (
    <>
      <StatusBar style={esOscuro ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <TemaProvider>
      <AuthProvider>
        <Raiz />
      </AuthProvider>
    </TemaProvider>
  );
}