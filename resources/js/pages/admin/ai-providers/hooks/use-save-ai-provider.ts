import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { update } from '@/routes/admin/ai-providers';

type SaveAiProviderData = {
    label: string;
    default_model: string;
    api_key: string;
};

export function useSaveAiProvider(onSuccess: () => void) {
    const [processing, setProcessing] = useState(false);

    const saveProvider = (providerId: number, data: SaveAiProviderData) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.put(update(providerId).url, data, {
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

                return 'Configuración guardada correctamente';
            },
            error: 'Revisa los campos e intenta nuevamente',
        });
    };

    return { saveProvider, processing };
}
