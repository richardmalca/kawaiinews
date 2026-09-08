import { Head, Link } from '@inertiajs/react';
import { TriangleAlert } from 'lucide-react';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AnalyzeWithAiButton from '@/pages/admin/news-review/components/analyze-with-ai-button';
import NewsClusterRow from '@/pages/admin/news-review/components/news-cluster-row';
import NewsReviewSortSelect from '@/pages/admin/news-review/components/news-review-sort-select';
import RunScraperButton from '@/pages/admin/news-review/components/run-scraper-button';
import { index as newsSourcesIndex } from '@/routes/admin/news-sources';
import type { NewsCluster, NewsReviewSort } from '@/types/admin';

type Props = {
    clusters: NewsCluster[];
    hasActiveSources: boolean;
    sort: NewsReviewSort;
};

export default function NewsReviewIndex({
    clusters,
    hasActiveSources,
    sort,
}: Props) {
    return (
        <>
            <Head title="Revisar noticias" />

            <div className="space-y-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Heading
                        title="Revisar noticias"
                        description="Noticias encontradas en tus fuentes activas. Acepta las que valen la pena o descarta el resto"
                    />
                    <div className="flex flex-wrap gap-2">
                        <AnalyzeWithAiButton disabled={clusters.length === 0} />
                        <RunScraperButton disabled={!hasActiveSources} />
                    </div>
                </div>

                {!hasActiveSources && (
                    <Alert variant="destructive">
                        <TriangleAlert />
                        <AlertTitle>No hay fuentes activas</AlertTitle>
                        <AlertDescription>
                            Activa al menos una fuente con RSS en{' '}
                            <Link href={newsSourcesIndex().url}>
                                Fuentes de noticias
                            </Link>{' '}
                            antes de buscar noticias.
                        </AlertDescription>
                    </Alert>
                )}

                {clusters.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        No hay noticias pendientes de revisión. Prueba "Buscar
                        noticias ahora" para traer novedades de tus fuentes
                        activas.
                    </p>
                ) : (
                    <div className="space-y-3">
                        <div className="flex justify-end">
                            <NewsReviewSortSelect value={sort} />
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tema</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Fuentes</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>IA / Estado</TableHead>
                                        <TableHead className="text-right">
                                            Acciones
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clusters.map((cluster) => (
                                        <NewsClusterRow
                                            key={cluster.id}
                                            cluster={cluster}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

NewsReviewIndex.layout = {
    breadcrumbs: [
        {
            title: 'Revisar noticias',
            href: '/admin/news-review',
        },
    ],
};
