/*
Modal genérico para Synaptic Flow.

Componente reutilizable para mostrar contenido en una ventana
modal con overlay y botón de cierre.

@module Modal
@component
*/

import React from 'react';

/**
 * Modal genérico con overlay y cierre automático.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Contenido del modal.
 * @param {Function} props.onClose - Función para cerrar el modal.
 * @returns {JSX.Element} Ventana modal.
 */
export default function Modal({ children, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    {children}
                </div>
            </div>
        </div>
    );
};
