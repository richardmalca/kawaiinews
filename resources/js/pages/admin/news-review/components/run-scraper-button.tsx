import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useRunScraper } from '@/pages/admin/news-review/hooks/use-run-scraper';

export default function RunScraperButton() {
    const { runScraper, processing } = useRunScraper();

    return (
        <Button type="button" disabled={processing} onClick={runScraper}>
            {processing ? <Spinner /> : <Search />}
            Buscar noticias ahora
        </Button>
    );
}
