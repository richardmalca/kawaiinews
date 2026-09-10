import { Head, router } from '@inertiajs/react';
import {
    EyeOff,
    MessageSquare,
    MessagesSquare,
    Reply,
    Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import CommentsTable from '@/pages/admin/comments/components/comments-table';
import KpiCard from '@/pages/admin/dashboard/components/kpi-card';
import { index } from '@/routes/admin/comments';
import type { AdminComment, AdminCommentsKpis } from '@/types/admin';

type Meta = {
    current_page: number;
    last_page: number;
    total: number;
};

type Filters = {
    search: string | null;
    article_id: number | null;
    spoilers_only: boolean;
};

type Props = {
    comments: AdminComment[];
    meta: Meta;
    filters: Filters;
    kpis: AdminCommentsKpis;
    articlesWithComments: { id: number; title: string }[];
};

export default function CommentsIndex({
    comments,
    meta,
    filters,
    kpis,
    articlesWithComments,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    // Debounce: no hace falta buscar en cada tecla, solo cuando el usuario
    // deja de escribir un rato.
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (search === (filters.search ?? '')) {
                return;
            }

            applyFilters({ search: search || null });
        }, 400);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const applyFilters = (next: Partial<Filters> & { page?: number }) => {
        const merged = { ...filters, ...next };

        router.get(
            index().url,
            {
                ...(merged.search ? { search: merged.search } : {}),
                ...(merged.article_id ? { article_id: merged.article_id } : {}),
                ...(merged.spoilers_only ? { spoilers_only: 1 } : {}),
                ...(next.page ? { page: next.page } : {}),
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['comments', 'meta', 'filters'],
            },
        );
    };

    return (
        <>
            <Head title="Comentarios" />

            <div className="space-y-6 p-4">
                <Heading
                    title="Comentarios"
                    description="Modera los comentarios de los usuarios en las noticias"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <KpiCard
                        icon={MessagesSquare}
                        label="Comentarios totales"
                        value={kpis.total}
                    />
                    <KpiCard
                        icon={MessageSquare}
                        label="Hoy"
                        value={kpis.today}
                        sublabel={`${kpis.this_week} esta semana`}
                    />
                    <KpiCard
                        icon={Reply}
                        label="Respuestas"
                        value={kpis.replies}
                        sublabel={`${kpis.total - kpis.replies} raíz`}
                    />
                    <KpiCard
                        icon={EyeOff}
                        label="Marcados spoiler"
                        value={kpis.spoilers}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative max-w-xs flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar en el texto..."
                            className="pl-8"
                        />
                    </div>

                    <Select
                        value={filters.article_id?.toString() ?? 'all'}
                        onValueChange={(value) =>
                            applyFilters({
                                article_id:
                                    value === 'all' ? null : Number(value),
                            })
                        }
                    >
                        <SelectTrigger className="w-56">
                            <SelectValue placeholder="Todas las noticias" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                Todas las noticias
                            </SelectItem>
                            {articlesWithComments.map((article) => (
                                <SelectItem
                                    key={article.id}
                                    value={article.id.toString()}
                                >
                                    <span className="line-clamp-1">
                                        {article.title}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                        <Switch
                            id="spoilers-only"
                            checked={filters.spoilers_only}
                            onCheckedChange={(checked) =>
                                applyFilters({ spoilers_only: checked })
                            }
                        />
                        <label
                            htmlFor="spoilers-only"
                            className="text-sm select-none"
                        >
                            Solo spoilers
                        </label>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <CommentsTable comments={comments} />
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
                                onClick={() =>
                                    applyFilters({
                                        page: meta.current_page - 1,
                                    })
                                }
                            >
                                Anterior
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={meta.current_page >= meta.last_page}
                                onClick={() =>
                                    applyFilters({
                                        page: meta.current_page + 1,
                                    })
                                }
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

CommentsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Comentarios',
            href: '/admin/comments',
        },
    ],
};
