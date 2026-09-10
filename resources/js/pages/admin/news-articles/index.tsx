import { Head, Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import NewsArticlesTable from '@/pages/admin/news-articles/components/news-articles-table';
import { create, index } from '@/routes/admin/news-articles';
import type { NewsArticle } from '@/types/admin';

type Meta = {
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    articles: NewsArticle[];
    meta: Meta;
    category: string | null;
    categories: string[];
};

export default function NewsArticlesIndex({
    articles,
    meta,
    category,
    categories,
}: Props) {
    const handleCategoryChange = (value: string) => {
        router.get(index().url, value === 'all' ? {} : { category: value }, {
            preserveState: true,
            preserveScroll: true,
            only: ['articles', 'meta', 'category'],
        });
    };

    const goToPage = (page: number) => {
        router.get(
            index().url,
            { ...(category ? { category } : {}), page },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['articles', 'meta', 'category'],
            },
        );
    };

    return (
        <>
            <Head title="Noticias" />

            <div className="space-y-8 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Heading
                        title="Noticias"
                        description="Administra las noticias creadas a partir de la bandeja de revisión"
                    />
                    <div className="flex items-center gap-2">
                        <Select
                            value={category ?? 'all'}
                            onValueChange={handleCategoryChange}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Todas las categorías" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Todas las categorías
                                </SelectItem>
                                {categories.map((item) => (
                                    <SelectItem
                                        key={item}
                                        value={item}
                                        className="capitalize"
                                    >
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button asChild>
                            <Link href={create()}>
                                <Plus />
                                Nueva noticia
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <NewsArticlesTable articles={articles} />
                </div>

                {meta.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm">
                            Página {meta.current_page} de {meta.last_page} (
                            {meta.total} en total)
                        </p>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={meta.current_page <= 1}
                                onClick={() => goToPage(meta.current_page - 1)}
                            >
                                Anterior
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={meta.current_page >= meta.last_page}
                                onClick={() => goToPage(meta.current_page + 1)}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
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
