import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { toggle } from '@/routes/admin/news-sources';

export function useToggleNewsSource() {
    const [processing, setProcessing] = useState(false);

    const toggleSource = (sourceId: number, willActivate: boolean) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.post(
                toggle(sourceId).url,
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
            loading: willActivate
                ? 'Activando fuente...'
                : 'Desactivando fuente...',
            success: willActivate ? 'Fuente activada' : 'Fuente desactivada',
            error: 'No se pudo actualizar la fuente',
        });
    };

    return { toggleSource, processing };
}
