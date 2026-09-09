import { router, useHttp } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { waitForJobRun } from '@/pages/admin/news-review/hooks/use-job-run';
import { analyze } from '@/routes/admin/news-review';

type AnalyzeQueuedResponse = { run_id: string };

type AnalyzeResult = {
    analyzed: number;
    error: string | null;
};

export function useAnalyzeWithAi() {
    const { submit } = useHttp();
    const [processing, setProcessing] = useState(false);

    const analyzeWithAi = () => {
        setProcessing(true);

        const promise = (submit(analyze()) as Promise<AnalyzeQueuedResponse>)
            .then((queued) => waitForJobRun<AnalyzeResult>(queued.run_id))
            .then((result) => {
                if (result.error) {
                    throw new Error(result.error);
                }

                return result;
            })
            .finally(() => {
                setProcessing(false);
                router.reload({ only: ['clusters', 'hasPublishVerdicts'] });
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
