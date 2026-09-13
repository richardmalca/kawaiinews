import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { waitForJobRun } from '@/lib/job-run';
import { edit } from '@/routes/admin/news-articles';
import { accept } from '@/routes/admin/news-review';

function readCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

export function useAcceptNewsCluster() {
    const [processing, setProcessing] = useState(false);

    const acceptCluster = (clusterId: number) => {
        setProcessing(true);

        const promise = fetch(accept(clusterId).url, {
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
                    throw new Error('No se pudo aceptar la noticia');
                }

                return waitForJobRun<{ article_id: number }>(queued.run_id);
            })
            .then(
                (result) =>
                    new Promise<{ article_id: number }>((resolve) => {
                        // No navegamos automáticamente al editor: si el
                        // admin está aceptando varias noticias seguidas,
                        // saltar a otra página en cada una lo saca de la
                        // bandeja cada vez. Solo actualizamos esta fila (ya
                        // no aparece pendiente) y dejamos un botón "Editar"
                        // en el toast para quien sí quiera ir ahora.
                        router.reload({
                            only: ['clusters', 'meta', 'kpis'],
                            onFinish: () => resolve(result),
                        });
                    }),
            )
            .finally(() => setProcessing(false));

        toast.promise(promise, {
            loading: 'Generando borrador de la noticia...',
            success: (result: { article_id: number }) => ({
                message: 'Noticia creada como borrador',
                action: {
                    label: 'Editar',
                    onClick: () => router.visit(edit(result.article_id).url),
                },
            }),
            error: (error: Error) => error.message,
        });
    };

    return { acceptCluster, processing };
}
