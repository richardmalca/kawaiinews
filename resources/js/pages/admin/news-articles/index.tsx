import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Card, CardContent } from '@/components/ui/card';
import NewsArticlesTable from '@/pages/admin/news-articles/components/news-articles-table';
import type { NewsArticle } from '@/types/admin';

type Props = {
    articles: NewsArticle[];
};

export default function NewsArticlesIndex({ articles }: Props) {
    return (
        <>
            <Head title="Noticias" />

            <div className="space-y-8 p-4">
                <Heading
                    title="Noticias"
                    description="Administra las noticias creadas a partir de la bandeja de revisión"
                />

                <Card>
                    <CardContent>
                        <NewsArticlesTable articles={articles} />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

NewsArticlesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Noticias',
            href: '/admin/news-articles',
        },
    ],
};
