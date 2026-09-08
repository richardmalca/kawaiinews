import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { reject as rejectRoute } from '@/routes/admin/news-review';

export function useRejectNewsCluster() {
    const [processing, setProcessing] = useState(false);

    const rejectCluster = (clusterId: number) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.post(
                rejectRoute(clusterId).url,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => resolve(),
                    onError: () => reject(),
                    onFinish: () => setProcessing(false),
                },
            );
        });

        toast.promise(promise, {
            loading: 'Descartando...',
            success: 'Noticia descartada',
            error: 'No se pudo descartar la noticia',
        });
    };

    return { rejectCluster, processing };
}
