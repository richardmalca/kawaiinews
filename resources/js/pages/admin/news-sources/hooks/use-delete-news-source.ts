import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { destroy } from '@/routes/admin/news-sources';

export function useDeleteNewsSource() {
    const [processing, setProcessing] = useState(false);

    const deleteSource = (sourceId: number) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.delete(destroy(sourceId).url, {
                preserveScroll: true,
                onSuccess: () => resolve(),
                onError: () => reject(),
                onFinish: () => setProcessing(false),
            });
        });

        toast.promise(promise, {
            loading: 'Eliminando fuente...',
            success: 'Fuente eliminada',
            error: 'No se pudo eliminar la fuente',
        });
    };

    return { deleteSource, processing };
}
