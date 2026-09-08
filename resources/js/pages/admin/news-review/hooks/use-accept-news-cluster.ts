import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { accept } from '@/routes/admin/news-review';

export function useAcceptNewsCluster() {
    const [processing, setProcessing] = useState(false);

    const acceptCluster = (clusterId: number) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.post(
                accept(clusterId).url,
                {},
                {
                    onSuccess: () => resolve(),
                    onError: () => reject(),
                    onFinish: () => setProcessing(false),
                },
            );
        });

        toast.promise(promise, {
            loading: 'Generando borrador de la noticia...',
            success: 'Noticia creada como borrador',
            error: 'No se pudo aceptar la noticia',
        });
    };

    return { acceptCluster, processing };
}
