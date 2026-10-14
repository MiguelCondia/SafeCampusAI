import React from 'react';
import AdminLayout from './AdminLayout';

// Recibe una pantalla (ej: ReportesAdminScreen) y devuelve una nueva pantalla
// que es la misma, pero dentro de la barra lateral del administrador.
// Es un "componente de orden superior": una función que envuelve componentes.
export default function conLayoutAdmin(Pantalla) {
    return function PantallaConLayout(props) {
        // props trae navigation y route; se los pasamos a la pantalla original sin tocarlos
        return (
        <AdminLayout>
            <Pantalla {...props} />
        </AdminLayout>
        );
    };
}