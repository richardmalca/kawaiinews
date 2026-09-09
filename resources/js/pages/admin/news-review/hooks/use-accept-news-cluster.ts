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
            .then((result) => {
                router.visit(edit(result.article_id).url);
            })
            .finally(() => setProcessing(false));

        toast.promise(promise, {
            loading: 'Generando borrador de la noticia...',
            success: 'Noticia creada como borrador',
            error: (error: Error) => error.message,
        });
    };

    return { acceptCluster, processing };
}
