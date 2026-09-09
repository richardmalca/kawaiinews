import { router, useHttp } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { waitForJobRun } from '@/pages/admin/news-review/hooks/use-job-run';
import { applyAiVerdicts } from '@/routes/admin/news-review';

type ApplyQueuedResponse = { run_id: string };

type ApplyResult = {
    applied: number;
    article_ids: number[];
};

export function useApplyAiVerdicts() {
    const { submit } = useHttp();
    const [processing, setProcessing] = useState(false);

    const apply = () => {
        setProcessing(true);

        const promise = (
            submit(applyAiVerdicts()) as Promise<ApplyQueuedResponse>
        )
            .then((queued) => waitForJobRun<ApplyResult>(queued.run_id))
            .finally(() => {
                setProcessing(false);
                router.reload({ only: ['clusters', 'hasPublishVerdicts'] });
            });

        toast.promise(promise, {
            loading:
                'Aceptando y redactando las noticias marcadas para publicar...',
            success: (result: ApplyResult) =>
                `${result.applied} noticias convertidas en borrador`,
            error: 'No se pudo aplicar los veredictos',
        });
    };

    return { apply, processing };
}
