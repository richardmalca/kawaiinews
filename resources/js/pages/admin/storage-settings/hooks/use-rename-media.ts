import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { waitForJobRun } from '@/lib/job-run';
import storageSettingsRoutes from '@/routes/admin/storage-settings';

type RenameResult = {
    renamed: number;
    already_ok: number;
    failed: number;
    optimized: number;
};

function readCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

function summarize(result: RenameResult): string {
    if (result.renamed === 0) {
        return 'Ya estaba todo con el nombre parejo, no había nada para cambiar.';
    }

    const parts = [`Se les puso el nombre nuevo a ${result.renamed} archivos.`];

    if (result.optimized > 0) {
        parts.push(
            `De paso, ${result.optimized} se aligeraron porque todavía no estaban optimizados.`,
        );
    }

    if (result.failed > 0) {
        parts.push(
            `${result.failed} no se pudieron cambiar, revisalos e intentá de nuevo.`,
        );
    }

    return parts.join(' ');
}

export function useRenameMedia() {
    const [processing, setProcessing] = useState(false);

    const rename = () => {
        setProcessing(true);

        const promise = fetch(storageSettingsRoutes.media.rename().url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': readCsrfToken(),
            },
        })
            .then((response) => response.json())
            .then((queued: { run_id?: string }) => {
                if (!queued.run_id) {
                    throw new Error('No se pudo empezar a unificar los nombres');
                }

                // RenameMediaFilesJob tiene 900s de timeout en el servidor
                // (puede tocar muchos archivos), por encima de los 3
                // minutos por defecto de waitForJobRun.
                return waitForJobRun<RenameResult>(
                    queued.run_id,
                    16 * 60 * 1000,
                );
            })
            .then((result) => {
                router.reload({ only: ['mediaLocation'] });

                return result;
            })
            .finally(() => setProcessing(false));

        toast.promise(promise, {
            loading: 'Poniéndole el mismo nombre a todos los archivos...',
            success: (result: RenameResult) => summarize(result),
            error: (error: Error) => error.message,
        });
    };

    return { rename, processing };
}
