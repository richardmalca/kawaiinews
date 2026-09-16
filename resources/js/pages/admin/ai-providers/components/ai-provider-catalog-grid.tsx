import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AiProviderCatalogRow from '@/pages/admin/ai-providers/components/ai-provider-catalog-row';
import type { AiProvider, AiProviderCatalogEntry } from '@/types/admin';

type Props = {
    catalog: AiProviderCatalogEntry[];
    providers: AiProvider[];
};

function CatalogGrid({
    entries,
    providers,
}: {
    entries: AiProviderCatalogEntry[];
    providers: AiProvider[];
}) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {entries.map((entry) => (
                <AiProviderCatalogRow
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

export default function AiProviderCatalogGrid({ catalog, providers }: Props) {
    const configured = catalog.filter((entry) => entry.configured);
    const notConfigured = catalog.filter((entry) => !entry.configured);

    return (
        <Tabs defaultValue="configured">
            <TabsList>
                <TabsTrigger value="configured">
                    Cargados ({configured.length})
                </TabsTrigger>
                <TabsTrigger value="available">
                    Por agregar ({notConfigured.length})
                </TabsTrigger>
            </TabsList>

            <TabsContent value="configured">
                {configured.length > 0 ? (
                    <CatalogGrid entries={configured} providers={providers} />
                ) : (
                    <p className="text-muted-foreground text-sm">
                        Todavía no cargaste ningún proveedor. Elegí uno de la
                        pestaña "Por agregar" para empezar.
                    </p>
                )}
            </TabsContent>

            <TabsContent value="available">
                <CatalogGrid entries={notConfigured} providers={providers} />
            </TabsContent>
        </Tabs>
    );
}
