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

export default function AiProviderCatalogGrid({ catalog, providers }: Props) {
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
                    {catalog.map((entry) => (
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
