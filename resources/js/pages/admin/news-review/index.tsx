import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import NewsClusterCard from '@/pages/admin/news-review/components/news-cluster-card';
import RunScraperButton from '@/pages/admin/news-review/components/run-scraper-button';
import type { NewsCluster } from '@/types/admin';

type Props = {
    clusters: NewsCluster[];
};

export default function NewsReviewIndex({ clusters }: Props) {
    return (
        <>
            <Head title="Revisar noticias" />

            <div className="space-y-8 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Revisar noticias"
                        description="Noticias encontradas en tus fuentes activas, ordenadas por relevancia. Aceptá las que valen la pena o descartá el resto"
                    />
                    <RunScraperButton />
                </div>

                {clusters.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        No hay noticias pendientes de revisión. Probá
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
