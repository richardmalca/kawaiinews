import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import category from '@/routes/admin/news-sources/category';

export function useToggleCategoryNewsSources() {
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
            error: 'No se pudo actualizar la categoría',
        });
    };

    const activateCategory = (categoryKey: string, categoryLabel: string) =>
        run(
            category.activate(categoryKey).url,
            `Activando ${categoryLabel}...`,
            `${categoryLabel}: todas activadas`,
        );

    const deactivateCategory = (categoryKey: string, categoryLabel: string) =>
        run(
            category.deactivate(categoryKey).url,
            `Desactivando ${categoryLabel}...`,
            `${categoryLabel}: todas desactivadas`,
        );

    return { activateCategory, deactivateCategory, processing };
}
