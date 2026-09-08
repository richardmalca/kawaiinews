import { Layers, Rss, Tags } from 'lucide-react';
import AiProviderStat from '@/pages/admin/ai-providers/components/ai-provider-stat';
import { useNewsSourceSummary } from '@/pages/admin/news-sources/hooks/use-news-source-summary';
import type { NewsSourceSummary as NewsSourceSummaryType } from '@/types/admin';

type Props = {
    summary: NewsSourceSummaryType;
};

export default function NewsSourceSummary({ summary }: Props) {
    const { activeLabel } = useNewsSourceSummary(summary);

    return (
        <div className="grid gap-4 sm:grid-cols-3">
            <AiProviderStat
                icon={Rss}
                label="Fuentes activas"
                value={activeLabel}
            />
            <AiProviderStat
                icon={Layers}
                label="Fuentes disponibles"
                value={String(summary.total_sources)}
            />
            <AiProviderStat
                icon={Tags}
                label="Categorías con fuentes activas"
                value={String(summary.categories_active)}
            />
        </div>
    );
}
