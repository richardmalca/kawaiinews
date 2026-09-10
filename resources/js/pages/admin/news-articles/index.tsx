import { Head, Link, router } from '@inertiajs/react';
import {
    FileText,
    ImageOff,
    Newspaper,
    Plus,
    SquareCheckBig,
} from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import KpiCard from '@/pages/admin/dashboard/components/kpi-card';
import NewsArticlesTable from '@/pages/admin/news-articles/components/news-articles-table';
import { create, index } from '@/routes/admin/news-articles';
import type { AdminNewsArticlesKpis, NewsArticle } from '@/types/admin';

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
    kpis: AdminNewsArticlesKpis;
};

export default function NewsArticlesIndex({
    articles,
    meta,
    category,
    categories,
    kpis,
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

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Noticias"
                        description="Administra las noticias creadas a partir de la bandeja de revisión"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Select
                            value={category ?? 'all'}
                            onValueChange={handleCategoryChange}
                        >
                            <SelectTrigger className="w-full sm:w-48">
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

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <KpiCard
                        icon={Newspaper}
                        label="Noticias totales"
                        value={kpis.total}
                        sublabel={
                            category ? `Categoría: ${category}` : undefined
                        }
                    />
                    <KpiCard
                        icon={SquareCheckBig}
                        label="Publicadas"
                        value={kpis.published}
                        sublabel={`${kpis.this_week} esta semana`}
                    />
                    <KpiCard
                        icon={FileText}
                        label="Borradores"
                        value={kpis.drafts}
                    />
                    <KpiCard
                        icon={ImageOff}
                        label="Sin imagen destacada"
                        value={kpis.without_image}
                    />
                </div>

                <NewsArticlesTable articles={articles} />

                {meta.last_page > 1 && (
                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
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
