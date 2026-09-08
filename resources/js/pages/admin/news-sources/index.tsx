import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import NewsSourceBulkActions from '@/pages/admin/news-sources/components/news-source-bulk-actions';
import NewsSourceCategoryCard from '@/pages/admin/news-sources/components/news-source-category-card';
import NewsSourceSummary from '@/pages/admin/news-sources/components/news-source-summary';
import type {
    NewsSourceGroup,
    NewsSourceSummary as NewsSourceSummaryType,
} from '@/types/admin';

type Props = {
    groups: NewsSourceGroup[];
    summary: NewsSourceSummaryType;
};

export default function NewsSourcesIndex({ groups, summary }: Props) {
    return (
        <>
            <Head title="Fuentes de noticias" />

            <div className="space-y-8 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Fuentes de noticias"
                        description="Activa los sitios que se usarán para obtener noticias de anime, manga, geek, gaming, Japón y películas"
                    />
                    <NewsSourceBulkActions />
                </div>

                <NewsSourceSummary summary={summary} />

                <div className="grid gap-4 lg:grid-cols-2">
                    {groups.map((group) => (
                        <NewsSourceCategoryCard
                            key={group.category}
                            group={group}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}

NewsSourcesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Fuentes de noticias',
            href: '/admin/news-sources',
        },
    ],
};
