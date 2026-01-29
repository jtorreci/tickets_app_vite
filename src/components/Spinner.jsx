"""
Componente Spinner de carga para Synaptic Flow.

Indicador visual de carga animado.

@module Spinner
@component
"""

import React from 'react';

/**
 * Spinner de carga animado.
 *
 * @returns {JSX.Element} Indicador de carga.
 */
export default function Spinner() {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>;
};
