import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { store } from '@/routes/admin/ai-providers';

type AddAiProviderData = {
    provider: string;
    label: string;
    default_model?: string;
    api_key: string;
};

export function useAddAiProvider(onSuccess: () => void) {
    const [processing, setProcessing] = useState(false);

    const addProvider = (data: AddAiProviderData) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.post(store().url, data, {
                preserveScroll: true,
                onSuccess: () => resolve(),
                onError: () => reject(),
                onFinish: () => setProcessing(false),
            });
        });

        toast.promise(promise, {
            loading: 'Agregando proveedor...',
            success: () => {
                onSuccess();

                return 'Proveedor agregado correctamente';
            },
            error: 'Revisa los campos e intenta nuevamente',
        });
    };

    return { addProvider, processing };
}
