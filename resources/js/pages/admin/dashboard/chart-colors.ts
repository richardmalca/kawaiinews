// La paleta --chart-1..5 de este preset visual es escala de grises (pensada
// para otra cosa), así que para series de datos reales usamos colores con
// tono propio, legibles en claro y oscuro.
export const CHART_COLORS = {
    views: '#ef4444',
    reactions: '#f59e0b',
    shares: '#22c55e',
    users: '#3b82f6',
    likes: '#8b5cf6',
} as const;
