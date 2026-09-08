import { router, useHttp } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { scrape } from '@/routes/admin/news-review';

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

        const promise = (submit(scrape()) as Promise<ScrapeResult>).finally(
            () => {
                setProcessing(false);
                router.reload({ only: ['clusters'] });
            },
        );

        toast.promise(promise, {
            loading: 'Buscando noticias en las fuentes activas...',
            success: (result: ScrapeResult) =>
                `${result.items_new} noticias nuevas encontradas de ${result.sources_scraped} fuentes`,
            error: 'No se pudo completar la búsqueda',
        });
    };

    return { runScraper, processing };
}
