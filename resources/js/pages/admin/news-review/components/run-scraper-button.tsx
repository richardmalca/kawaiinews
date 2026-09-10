import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useRunScraper } from '@/pages/admin/news-review/hooks/use-run-scraper';

type Props = {
    disabled?: boolean;
};

export default function RunScraperButton({ disabled = false }: Props) {
    const { runScraper, processing } = useRunScraper();

    return (
        <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={processing || disabled}
            onClick={runScraper}
        >
            {processing ? <Spinner /> : <Search />}
            Buscar noticias ahora
        </Button>
    );
}
