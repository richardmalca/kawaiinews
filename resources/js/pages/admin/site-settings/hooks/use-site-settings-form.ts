import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { update } from '@/routes/admin/site-settings';

type SiteSettingsData = {
    name: string;
    seo_title: string;
    description: string;
    keywords: string[];
    theme_color: string;
    twitter_handle: string;
    facebook_url: string;
    instagram_url: string;
    tiktok_url: string;
};

export function useSiteSettingsForm() {
    const [processing, setProcessing] = useState(false);

    const save = (data: SiteSettingsData) => {
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
            success: 'Configuración guardada',
            error: 'Revisá los campos e intentá de nuevo',
        });
    };

    return { save, processing };
}
