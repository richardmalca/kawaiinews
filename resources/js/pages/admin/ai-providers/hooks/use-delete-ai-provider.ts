import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { destroy } from '@/routes/admin/ai-providers';

export function useDeleteAiProvider() {
    const [processing, setProcessing] = useState(false);

    const deleteProvider = (providerId: number) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.delete(destroy(providerId).url, {
                preserveScroll: true,
                onSuccess: () => resolve(),
                onError: () => reject(),
                onFinish: () => setProcessing(false),
            });
        });

        toast.promise(promise, {
            loading: 'Eliminando proveedor...',
            success: 'Proveedor eliminado',
            error: 'No se pudo eliminar el proveedor',
        });
    };

    return { deleteProvider, processing };
}
