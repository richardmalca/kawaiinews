import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { reject as rejectRoute, restore } from '@/routes/admin/news-review';

function readCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

export function useRejectNewsCluster() {
    const [processing, setProcessing] = useState(false);

    const rejectCluster = (clusterId: number) => {
        setProcessing(true);

        // Fetch directo (no router.post): un POST de Inertia hace una
        // "visita" completa que empuja una entrada al historial del
        // navegador — al rechazar varias seguidas eso se siente como que
        // la página "se redirige" cada vez. Acá solo pedimos al servidor
        // que actualice los datos (clusters/meta/kpis) sin navegar.
        const promise = fetch(rejectRoute(clusterId).url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': readCsrfToken(),
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('No se pudo descartar la noticia');
                }
            })
            .then(
                () =>
                    new Promise<void>((resolve) => {
                        router.reload({
                            only: ['clusters', 'meta', 'kpis'],
                            onFinish: () => resolve(),
                        });
                    }),
            )
            .finally(() => setProcessing(false));

        toast.promise(promise, {
            loading: 'Descartando...',
            success: () => ({
                message: 'Noticia descartada',
                action: {
                    label: 'Deshacer',
                    onClick: () => undoReject(clusterId),
                },
            }),
            error: 'No se pudo descartar la noticia',
        });
    };

    const undoReject = (clusterId: number) => {
        const promise = fetch(restore(clusterId).url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': readCsrfToken(),
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('No se pudo deshacer');
                }
            })
            .then(
                () =>
                    new Promise<void>((resolve) => {
                        router.reload({
                            only: ['clusters', 'meta', 'kpis'],
                            onFinish: () => resolve(),
                        });
                    }),
            );

        toast.promise(promise, {
            loading: 'Deshaciendo...',
            success: 'Noticia devuelta a la bandeja',
            error: 'No se pudo deshacer',
        });
    };

    return { rejectCluster, processing };
}
