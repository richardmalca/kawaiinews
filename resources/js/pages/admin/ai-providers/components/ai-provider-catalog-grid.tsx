import AiProviderCatalogCard from '@/pages/admin/ai-providers/components/ai-provider-catalog-card';
import type { AiProvider, AiProviderCatalogEntry } from '@/types/admin';

type Props = {
    catalog: AiProviderCatalogEntry[];
    providers: AiProvider[];
};

export default function AiProviderCatalogGrid({ catalog, providers }: Props) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((entry) => (
                <AiProviderCatalogCard
                    key={entry.provider}
                    entry={entry}
                    provider={
                        providers.find((p) => p.id === entry.provider_id) ??
                        null
                    }
                />
            ))}
        </div>
    );
}
