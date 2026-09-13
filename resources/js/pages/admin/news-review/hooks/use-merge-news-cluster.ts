import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { merge } from '@/routes/admin/news-review';

function readCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

export function useMergeNewsCluster() {
    const [processing, setProcessing] = useState(false);

    const mergeCluster = (sourceId: number, targetId: number) => {
        setProcessing(true);

        const promise = fetch(merge(sourceId).url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': readCsrfToken(),
            },
            body: JSON.stringify({ target_id: targetId }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('No se pudo fusionar');
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
            loading: 'Fusionando...',
            success: 'Noticias fusionadas',
            error: 'No se pudo fusionar',
        });
    };

    return { mergeCluster, processing };
}
