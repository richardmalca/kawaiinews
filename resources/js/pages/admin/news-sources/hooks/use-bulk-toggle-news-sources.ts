import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { activateAll, deactivateAll } from '@/routes/admin/news-sources';

export function useBulkToggleNewsSources() {
    const [processing, setProcessing] = useState(false);

    const run = (url: string, loading: string, success: string) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.post(
                url,
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
            loading,
            success,
            error: 'No se pudo actualizar las fuentes',
        });
    };

    const activateAllSources = () =>
        run(activateAll().url, 'Activando todas las fuentes...', 'Todas las fuentes activadas');

    const deactivateAllSources = () =>
        run(deactivateAll().url, 'Desactivando todas las fuentes...', 'Todas las fuentes desactivadas');

    return { activateAllSources, deactivateAllSources, processing };
}
