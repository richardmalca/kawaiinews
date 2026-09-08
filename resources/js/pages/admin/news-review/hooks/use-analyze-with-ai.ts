import { router, useHttp } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { analyze } from '@/routes/admin/news-review';

type AnalyzeResult = {
    analyzed: number;
    error: string | null;
};

export function useAnalyzeWithAi() {
    const { submit } = useHttp();
    const [processing, setProcessing] = useState(false);

    const analyzeWithAi = () => {
        setProcessing(true);

        const promise = (submit(analyze()) as Promise<AnalyzeResult>)
            .then((result) => {
                if (result.error) {
                    throw new Error(result.error);
                }

                return result;
            })
            .finally(() => {
                setProcessing(false);
                router.reload({ only: ['clusters'] });
            });

        toast.promise(promise, {
            loading: 'Analizando noticias pendientes con IA...',
            success: (result: AnalyzeResult) =>
                `${result.analyzed} noticias analizadas`,
            error: (error: Error) => error.message,
        });
    };

    return { analyzeWithAi, processing };
}
