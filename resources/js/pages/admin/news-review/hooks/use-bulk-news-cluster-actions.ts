import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { waitForJobRun } from '@/lib/job-run';
import { accept, reject as rejectRoute } from '@/routes/admin/news-review';

function readCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

function postJson(url: string): Promise<Response> {
    return fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': readCsrfToken(),
        },
    });
}

/**
 * Acciones en lote para la bandeja de revisión: reutilizan los mismos
 * endpoints por-cluster que ya usan los botones individuales (uno por
 * cluster, en paralelo) en vez de crear una ruta nueva — así no duplicamos
 * la lógica de aceptar (generar borrador con IA) ni la de rechazar.
 */
export function useBulkNewsClusterActions() {
    const [processing, setProcessing] = useState(false);

    const reloadList = () =>
        new Promise<void>((resolve) => {
            router.reload({
                only: ['clusters', 'meta', 'kpis'],
                onFinish: () => resolve(),
            });
        });

    const bulkAccept = async (clusterIds: number[]) => {
        setProcessing(true);

        const promise = Promise.allSettled(
            clusterIds.map((id) =>
                postJson(accept(id).url)
                    .then((response) => response.json())
                    .then((queued: { run_id?: string }) => {
                        if (!queued.run_id) {
                            throw new Error('sin run_id');
                        }

                        return waitForJobRun(queued.run_id);
                    }),
            ),
        )
            .then((results) => {
                const failed = results.filter(
                    (result) => result.status === 'rejected',
                ).length;

                if (failed > 0 && failed === results.length) {
                    throw new Error('No se pudo aceptar ninguna noticia');
                }

                return { total: results.length, failed };
            })
            .finally(() => {
                setProcessing(false);
                void reloadList();
            });

        toast.promise(promise, {
            loading: `Generando ${clusterIds.length} borrador(es)...`,
            success: ({ total, failed }) =>
                failed > 0
                    ? `${total - failed} de ${total} aceptadas (${failed} fallaron)`
                    : `${total} noticias aceptadas`,
            error: (error: Error) => error.message,
        });

        return promise;
    };

    const bulkReject = async (clusterIds: number[]) => {
        setProcessing(true);

        const promise = Promise.allSettled(
            clusterIds.map((id) => postJson(rejectRoute(id).url)),
        )
            .then((results) => {
                const failed = results.filter(
                    (result) =>
                        result.status === 'rejected' ||
                        (result.status === 'fulfilled' && !result.value.ok),
                ).length;

                if (failed > 0 && failed === results.length) {
                    throw new Error('No se pudo descartar ninguna noticia');
                }

                return { total: results.length, failed };
            })
            .finally(() => {
                setProcessing(false);
                void reloadList();
            });

        toast.promise(promise, {
            loading: `Descartando ${clusterIds.length} noticia(s)...`,
            success: ({ total, failed }) =>
                failed > 0
                    ? `${total - failed} de ${total} descartadas (${failed} fallaron)`
                    : `${total} noticias descartadas`,
            error: (error: Error) => error.message,
        });

        return promise;
    };

    return { bulkAccept, bulkReject, processing };
}
