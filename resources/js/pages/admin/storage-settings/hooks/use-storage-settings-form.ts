import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { update } from '@/routes/admin/storage-settings';

type StorageSettingsData = {
    access_key: string;
    secret_key: string;
    bucket: string;
    region: string;
    endpoint: string;
    use_path_style_endpoint: boolean;
    public_url: string;
};

export function useStorageSettingsForm() {
    const [processing, setProcessing] = useState(false);

    const save = (data: StorageSettingsData) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.put(update().url, data, {
                preserveScroll: true,
                onSuccess: () => resolve(),
                onError: () => reject(),
                onFinish: () => setProcessing(false),
            });
        });

        toast.promise(promise, {
            loading: 'Guardando...',
            success: 'Credenciales guardadas',
            error: 'Revisá los campos e intentá de nuevo',
        });
    };

    return { save, processing };
}
