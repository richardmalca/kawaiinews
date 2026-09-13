import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { waitForJobRun } from '@/lib/job-run';
import storageSettingsRoutes from '@/routes/admin/storage-settings';

type MigrationResult = {
    moved: number;
    already_there: number;
    failed: number;
    optimized: number;
};

function readCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

function summarize(result: MigrationResult): string {
    if (result.moved === 0) {
        return 'No había nada para mover, ya estaba todo en el lugar elegido.';
    }

    const parts = [`Se movieron ${result.moved} archivos.`];

    if (result.optimized > 0) {
        parts.push(
            `De paso, ${result.optimized} se aligeraron porque todavía no estaban optimizados.`,
        );
    }

    if (result.failed > 0) {
        parts.push(
            `${result.failed} no se pudieron mover, revisalos e intentá de nuevo.`,
        );
    }

    return parts.join(' ');
}

export function useMigrateMedia() {
    const [processing, setProcessing] = useState(false);

    const migrate = (direction: 'remote' | 'local') => {
        setProcessing(true);

        const promise = fetch(storageSettingsRoutes.media.migrate().url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': readCsrfToken(),
            },
            body: JSON.stringify({ direction }),
        })
            .then((response) => response.json())
            .then((queued: { run_id?: string }) => {
                if (!queued.run_id) {
                    throw new Error('No se pudo iniciar el traslado');
                }

                return waitForJobRun<MigrationResult>(queued.run_id);
            })
            .then((result) => {
                router.reload({ only: ['mediaLocation'] });

                return result;
            })
            .finally(() => setProcessing(false));

        toast.promise(promise, {
            loading:
                direction === 'remote'
                    ? 'Llevando tus archivos al almacenamiento externo...'
                    : 'Trayendo tus archivos de vuelta...',
            success: (result: MigrationResult) => summarize(result),
            error: (error: Error) => error.message,
        });
    };

    return { migrate, processing };
}
