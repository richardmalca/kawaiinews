import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AiProviderCatalogRow from '@/pages/admin/ai-providers/components/ai-provider-catalog-row';
import type { AiProvider, AiProviderCatalogEntry } from '@/types/admin';

type Props = {
    catalog: AiProviderCatalogEntry[];
    providers: AiProvider[];
};

function CatalogTable({
    entries,
    providers,
}: {
    entries: AiProviderCatalogEntry[];
    providers: AiProvider[];
}) {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Soporta</TableHead>
                        <TableHead>Modelos</TableHead>
                        <TableHead>Activo para</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries.map((entry) => (
                        <AiProviderCatalogRow
                            key={entry.provider}
                            entry={entry}
                            provider={
                                providers.find(
                                    (p) => p.id === entry.provider_id,
                                ) ?? null
                            }
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export default function AiProviderCatalogGrid({ catalog, providers }: Props) {
    const configured = catalog.filter((entry) => entry.configured);
    const notConfigured = catalog.filter((entry) => !entry.configured);

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-sm font-medium">
                    Cargados ({configured.length})
                </h2>
                {configured.length > 0 ? (
                    <CatalogTable
                        entries={configured}
                        providers={providers}
                    />
                ) : (
                    <p className="text-muted-foreground text-sm">
                        Todavía no cargaste ningún proveedor. Elegí uno de la
                        lista de abajo para empezar.
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <h2 className="text-muted-foreground text-sm font-medium">
                    Por agregar ({notConfigured.length})
                </h2>
                <CatalogTable entries={notConfigured} providers={providers} />
            </div>
        </div>
    );
}
