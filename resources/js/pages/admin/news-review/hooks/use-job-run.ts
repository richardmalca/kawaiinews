import { runStatus } from '@/routes/admin/news-review';

type RunStatusResponse<T> = {
    status: 'queued' | 'done' | 'failed' | 'unknown';
    result: T | null;
    error: string | null;
};

const POLL_INTERVAL_MS = 1500;

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForJobRun<T>(runId: string): Promise<T> {
    while (true) {
        const response = await fetch(runStatus(runId).url, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        });

        const data = (await response.json()) as RunStatusResponse<T>;

        if (data.status === 'done') {
            return data.result as T;
        }

        if (data.status === 'failed' || data.status === 'unknown') {
            throw new Error(data.error ?? 'La operación falló');
        }

        await wait(POLL_INTERVAL_MS);
    }
}
