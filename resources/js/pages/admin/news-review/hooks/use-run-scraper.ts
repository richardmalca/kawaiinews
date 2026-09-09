import { router, useHttp } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { waitForJobRun } from '@/pages/admin/news-review/hooks/use-job-run';
import { scrape } from '@/routes/admin/news-review';

type ScrapeQueuedResponse = {
    run_id?: string;
    sources_scraped?: number;
    items_found?: number;
    items_new?: number;
    errors?: string[];
};

type ScrapeResult = {
    sources_scraped: number;
    items_found: number;
    items_new: number;
    errors: string[];
};

export function useRunScraper() {
    const { submit } = useHttp();
    const [processing, setProcessing] = useState(false);

    const runScraper = () => {
        setProcessing(true);

        const promise = (submit(scrape()) as Promise<ScrapeQueuedResponse>)
            .then((queued) => {
                if (!queued.run_id) {
                    throw new Error(
                        queued.errors?.[0] ??
                            'No hay fuentes activas para buscar noticias',
                    );
                }

                return waitForJobRun<ScrapeResult>(queued.run_id);
            })
            .finally(() => {
                setProcessing(false);
                router.reload({ only: ['clusters', 'hasPublishVerdicts'] });
            });

        toast.promise(promise, {
            loading: 'Buscando noticias en las fuentes activas...',
            success: (result: ScrapeResult) =>
                `${result.items_new} noticias nuevas encontradas de ${result.sources_scraped} fuentes`,
            error: (error: Error) => error.message,
        });
    };

    return { runScraper, processing };
}
