import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

// En celular, el HTML se muestra dentro de un WebView (un mini navegador embebido)
export default function MapaLeaflet({ html, altura, onSeleccionar }) {
    return (
        <View style={{ height: altura, borderRadius: 14, overflow: 'hidden' }}>
        <WebView
            originWhitelist={['*']}
            // baseUrl da un "origen" a la página; sin él, OpenStreetMap puede rechazar los tiles
            source={{ html, baseUrl: 'https://safecampus.app' }}
            javaScriptEnabled
            onMessage={(evento) => {
            try {
                const msg = JSON.parse(evento.nativeEvent.data);
                if (msg.tipo === 'abrir') onSeleccionar(msg.id);
            } catch (e) {}
            }}
        />
        </View>
    );
}