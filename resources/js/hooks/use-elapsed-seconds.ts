import { useEffect, useState } from 'react';

/**
 * Segundos transcurridos desde `startedAt` (timestamp en ms), actualizado
 * cada segundo. Usado para mostrarle al admin cuánto lleva corriendo una
 * generación con IA en vez de dejarlo con un spinner mudo sin feedback.
 */
export function useElapsedSeconds(startedAt: number | null): number {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startedAt) {
            setElapsed(0);
            return;
        }

        const tick = () =>
            setElapsed(
                Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
            );

        tick();
        const interval = setInterval(tick, 1000);

        return () => clearInterval(interval);
    }, [startedAt]);

    return elapsed;
}
