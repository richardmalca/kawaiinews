import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import AiProviderCatalogGrid from '@/pages/admin/ai-providers/components/ai-provider-catalog-grid';
import AiProviderSummary from '@/pages/admin/ai-providers/components/ai-provider-summary';
import type {
    AiProvider,
    AiProviderCatalogEntry,
    AiProviderSummary as AiProviderSummaryType,
} from '@/types/admin';

type Props = {
    providers: AiProvider[];
    summary: AiProviderSummaryType;
    catalog: AiProviderCatalogEntry[];
};

export default function AiProvidersIndex({
    providers,
    summary,
    catalog,
}: Props) {
    return (
        <>
            <Head title="Modelo de IA" />

            <div className="space-y-8 p-4">
                <Heading
                    title="Modelo de IA"
                    description="Configura la conexión con el proveedor de IA que usará la plataforma"
                />

                <AiProviderSummary summary={summary} />

                <div className="space-y-3">
                    <h2 className="text-sm font-medium">
                        Proveedores disponibles
                    </h2>
                    <AiProviderCatalogGrid
                        catalog={catalog}
                        providers={providers}
                    />
                </div>
            </div>
        </>
    );
}

AiProvidersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Modelo de IA',
            href: '/admin/ai-providers',
        },
    ],
};
