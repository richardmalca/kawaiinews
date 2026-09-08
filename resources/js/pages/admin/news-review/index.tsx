import { Head, Link } from '@inertiajs/react';
import { TriangleAlert } from 'lucide-react';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import NewsClusterCard from '@/pages/admin/news-review/components/news-cluster-card';
import RunScraperButton from '@/pages/admin/news-review/components/run-scraper-button';
import { index as newsSourcesIndex } from '@/routes/admin/news-sources';
import type { NewsCluster } from '@/types/admin';

type Props = {
    clusters: NewsCluster[];
    hasActiveSources: boolean;
};

export default function NewsReviewIndex({
    clusters,
    hasActiveSources,
}: Props) {
    return (
        <>
            <Head title="Revisar noticias" />

            <div className="space-y-8 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Revisar noticias"
                        description="Noticias encontradas en tus fuentes activas, ordenadas por relevancia. Acepta las que valen la pena o descarta el resto"
                    />
                    <RunScraperButton disabled={!hasActiveSources} />
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
                        No hay noticias pendientes de revisión. Prueba
                        "Buscar noticias ahora" para traer novedades de tus
                        fuentes activas.
                    </p>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {clusters.map((cluster) => (
                            <NewsClusterCard
                                key={cluster.id}
                                cluster={cluster}
                            />
                        ))}
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
