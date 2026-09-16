import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AudioLines,
    FileText,
    ImageOff,
    Newspaper,
    Plus,
    Search,
    SquareCheckBig,
    TriangleAlert,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

type Missing = 'image' | 'audio' | null;

type Props = {
    articles: NewsArticle[];
    meta: Meta;
    category: string | null;
    search: string | null;
    missing: Missing;
    categories: string[];
    kpis: AdminNewsArticlesKpis;
};

const MISSING_LABELS: Record<'image' | 'audio', string> = {
    image: 'Sin imagen destacada',
    audio: 'Sin audio narrado',
};

export default function NewsArticlesIndex({
    articles,
    meta,
    category,
    search: initialSearch,
    missing,
    categories,
    kpis,
}: Props) {
    const { auth } = usePage().props;
    const canDelete = auth.user?.roles.includes('superadmin') ?? false;

    const [search, setSearch] = useState(initialSearch ?? '');

    // Debounce: no buscamos en cada tecla, solo cuando el usuario deja de
    // escribir un rato.
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (search === (initialSearch ?? '')) {
                return;
            }

            router.get(
                index().url,
                {
                    ...(category ? { category } : {}),
                    ...(missing ? { missing } : {}),
                    ...(search ? { search } : {}),
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['articles', 'meta', 'search'],
                },
            );
        }, 400);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const handleCategoryChange = (value: string) => {
        router.get(
            index().url,
            {
                ...(search ? { search } : {}),
                ...(missing ? { missing } : {}),
                ...(value === 'all' ? {} : { category: value }),
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['articles', 'meta', 'category'],
            },
        );
    };

    const applyMissingFilter = (value: 'image' | 'audio') => {
        router.get(
            index().url,
            {
                ...(category ? { category } : {}),
                ...(search ? { search } : {}),
                missing: value,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['articles', 'meta', 'missing'],
            },
        );
    };

    const clearMissingFilter = () => {
        router.get(
            index().url,
            {
                ...(category ? { category } : {}),
                ...(search ? { search } : {}),
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['articles', 'meta', 'missing'],
            },
        );
    };

    const goToPage = (page: number) => {
        router.get(
            index().url,
            {
                ...(category ? { category } : {}),
                ...(search ? { search } : {}),
                ...(missing ? { missing } : {}),
                page,
            },
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
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por título..."
                                className="pl-8"
                            />
                        </div>
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

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
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
                    <KpiCard
                        icon={AudioLines}
                        label="Sin audio narrado"
                        value={kpis.without_audio}
                    />
                </div>

                {!missing && (kpis.without_image > 0 || kpis.without_audio > 0) && (
                    <Alert>
                        <TriangleAlert className="h-4 w-4" />
                        <AlertTitle>Hay noticias incompletas</AlertTitle>
                        <AlertDescription>
                            <div className="flex flex-wrap items-center gap-2">
                                {kpis.without_image > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            applyMissingFilter('image')
                                        }
                                    >
                                        Ver {kpis.without_image} sin imagen
                                    </Button>
                                )}
                                {kpis.without_audio > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            applyMissingFilter('audio')
                                        }
                                    >
                                        Ver {kpis.without_audio} sin audio
                                    </Button>
                                )}
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {missing && (
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1.5">
                            {MISSING_LABELS[missing]}
                            <button
                                type="button"
                                onClick={clearMissingFilter}
                                aria-label="Quitar filtro"
                                className="hover:text-foreground"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    </div>
                )}

                <NewsArticlesTable articles={articles} canDelete={canDelete} />

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
