import { Head, Link, router } from '@inertiajs/react';
import { Clock, TriangleAlert } from 'lucide-react';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AnalyzeWithAiButton from '@/pages/admin/news-review/components/analyze-with-ai-button';
import ApplyAiVerdictsButton from '@/pages/admin/news-review/components/apply-ai-verdicts-button';
import NewsClusterRow from '@/pages/admin/news-review/components/news-cluster-row';
import NewsReviewCategorySelect from '@/pages/admin/news-review/components/news-review-category-select';
import NewsReviewSortSelect from '@/pages/admin/news-review/components/news-review-sort-select';
import RunScraperButton from '@/pages/admin/news-review/components/run-scraper-button';
import { index } from '@/routes/admin/news-review';
import { index as newsSourcesIndex } from '@/routes/admin/news-sources';
import type { NewsCluster, NewsReviewSort } from '@/types/admin';

type Meta = {
    current_page: number;
    last_page: number;
    total: number;
};

type NextRun = {
    at: string;
    in: string;
};

type Props = {
    clusters: NewsCluster[];
    hasActiveSources: boolean;
    hasPublishVerdicts: boolean;
    sort: NewsReviewSort;
    category: string | null;
    categories: string[];
    meta: Meta;
    nextScrapeAt: NextRun | null;
    nextAutoReviewAt: NextRun | null;
};

export default function NewsReviewIndex({
    clusters,
    hasActiveSources,
    hasPublishVerdicts,
    sort,
    category,
    categories,
    meta,
    nextScrapeAt,
    nextAutoReviewAt,
}: Props) {
    const goToPage = (page: number) => {
        router.get(
            index().url,
            { sort, ...(category ? { category } : {}), page },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['clusters', 'meta'],
            },
        );
    };

    return (
        <>
            <Head title="Revisar noticias" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Revisar noticias"
                        description="Noticias encontradas en tus fuentes activas. Acepta las que valen la pena o descarta el resto"
                    />
                    <div className="flex flex-wrap gap-2">
                        <AnalyzeWithAiButton disabled={clusters.length === 0} />
                        <ApplyAiVerdictsButton disabled={!hasPublishVerdicts} />
                        <RunScraperButton disabled={!hasActiveSources} />
                    </div>
                </div>

                {(nextScrapeAt || nextAutoReviewAt) && (
                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        {nextScrapeAt && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                Próximo scraping: {nextScrapeAt.in} (
                                {nextScrapeAt.at})
                            </span>
                        )}
                        {nextAutoReviewAt && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                Próximo análisis con IA: {nextAutoReviewAt.in}{' '}
                                ({nextAutoReviewAt.at})
                            </span>
                        )}
                    </div>
                )}

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

                {clusters.length === 0 && !category ? (
                    <p className="text-muted-foreground text-sm">
                        No hay noticias pendientes de revisión. Prueba "Buscar
                        noticias ahora" para traer novedades de tus fuentes
                        activas.
                    </p>
                ) : (
                    <div className="space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                            <NewsReviewCategorySelect
                                value={category}
                                categories={categories}
                            />
                            <NewsReviewSortSelect value={sort} />
                        </div>

                        {clusters.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No hay noticias pendientes en esta categoría.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tema</TableHead>
                                            <TableHead className="hidden md:table-cell">
                                                Categoría
                                            </TableHead>
                                            <TableHead className="hidden md:table-cell">
                                                Fuentes
                                            </TableHead>
                                            <TableHead className="hidden lg:table-cell">
                                                Fecha
                                            </TableHead>
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
                        )}

                        {meta.last_page > 1 && (
                            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                                <p className="text-muted-foreground text-sm">
                                    Página {meta.current_page} de{' '}
                                    {meta.last_page} ({meta.total} en total)
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={meta.current_page <= 1}
                                        onClick={() =>
                                            goToPage(meta.current_page - 1)
                                        }
                                    >
                                        Anterior
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                            meta.current_page >= meta.last_page
                                        }
                                        onClick={() =>
                                            goToPage(meta.current_page + 1)
                                        }
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        )}
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
