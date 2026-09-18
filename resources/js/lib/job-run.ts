import { runStatus } from '@/routes/admin/jobs';

type JobRun<T> = {
    status: 'queued' | 'done' | 'failed' | 'unknown';
    result: T | null;
    error: string | null;
};

const POLL_INTERVAL_MS = 1500;

// La mayoría de los jobs que se siguen con esto tienen un timeout de
// servidor de 150-300s — 3 minutos de margen alcanza para dejarlos
// terminar solos. Sin este límite, si el job se queda trabado sin
// completar ni fallar (ej. el worker de la cola se cae a mitad de camino),
// el polling seguía para siempre sin avisarle nada al usuario, hasta que
// el estado expiraba a los 15 minutos (JobRunStatus::TTL_MINUTES).
const DEFAULT_TIMEOUT_MS = 3 * 60 * 1000;

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForJobRun<T>(
    runId: string,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
    const deadline = Date.now() + timeoutMs;

    while (true) {
        const response = await fetch(runStatus(runId).url, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        });

        const data = (await response.json()) as JobRun<T>;

        if (data.status === 'done') {
            return data.result as T;
        }

        if (data.status === 'failed' || data.status === 'unknown') {
            throw new Error(data.error ?? 'La operación falló');
        }

        if (Date.now() >= deadline) {
            throw new Error(
                'Esto está tardando mucho más de lo normal. Puede seguir corriendo en segundo plano — revisá en unos minutos antes de reintentar.',
            );
        }

        await wait(POLL_INTERVAL_MS);
    }
}
