import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { update } from '@/routes/admin/news-sources';

type SaveNewsSourceData = {
    label: string;
    url: string;
    rss_url: string;
};

export function useSaveNewsSource(onSuccess: () => void) {
    const [processing, setProcessing] = useState(false);

    const saveSource = (sourceId: number, data: SaveNewsSourceData) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.put(update(sourceId).url, data, {
                preserveScroll: true,
                onSuccess: () => resolve(),
                onError: () => reject(),
                onFinish: () => setProcessing(false),
            });
        });

        toast.promise(promise, {
            loading: 'Guardando...',
            success: () => {
                onSuccess();

                return 'Fuente actualizada correctamente';
            },
            error: 'Revisa los campos e intenta nuevamente',
        });
    };

    return { saveSource, processing };
}
