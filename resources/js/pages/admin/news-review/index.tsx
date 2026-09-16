import { Head, Link, router } from '@inertiajs/react';
import {
    BadgeCheck,
    CalendarDays,
    Clock,
    Inbox,
    Search,
    Sparkles,
    TriangleAlert,
    Undo2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import KpiCard from '@/pages/admin/dashboard/components/kpi-card';
import AnalyzeWithAiButton from '@/pages/admin/news-review/components/analyze-with-ai-button';
import ApplyAiVerdictsButton from '@/pages/admin/news-review/components/apply-ai-verdicts-button';
import AutoAcceptControl from '@/pages/admin/news-review/components/auto-accept-control';
import NewsClusterRow from '@/pages/admin/news-review/components/news-cluster-row';
import NewsReviewCategorySelect from '@/pages/admin/news-review/components/news-review-category-select';
import NewsReviewSortSelect from '@/pages/admin/news-review/components/news-review-sort-select';
import RunScraperButton from '@/pages/admin/news-review/components/run-scraper-button';
import { useBulkNewsClusterActions } from '@/pages/admin/news-review/hooks/use-bulk-news-cluster-actions';
import { index } from '@/routes/admin/news-review';
import { index as newsSourcesIndex } from '@/routes/admin/news-sources';
import type {
    AdminNewsReviewKpis,
    NewsCluster,
    NewsReviewSort,
    NewsReviewView,
} from '@/types/admin';

const DATE_BUCKET_ORDER: NewsCluster['date_bucket'][] = [
    'hoy',
    'ayer',
    'semana',
    'antes',
];

const DATE_BUCKET_LABELS: Record<NewsCluster['date_bucket'], string> = {
    hoy: 'Hoy',
    ayer: 'Ayer',
    semana: 'Esta semana',
    antes: 'Más antiguas',
};

type Meta = {
    current_page: number;
    last_page: number;
    total: number;
};

type NextRun = {
    at: string;
    in: string;
};

type AutoAccept = {
    enabled: boolean;
    daily_limit: number;
};

type Props = {
    clusters: NewsCluster[];
    hasActiveSources: boolean;
    hasPublishVerdicts: boolean;
    sort: NewsReviewSort;
    category: string | null;
    search: string | null;
    view: NewsReviewView;
    categories: string[];
    meta: Meta;
    nextScrapeAt: NextRun | null;
    nextAutoReviewAt: NextRun | null;
    nextAutoAcceptAt: NextRun | null;
    autoAccept: AutoAccept;
    kpis: AdminNewsReviewKpis;
};

export default function NewsReviewIndex({
    clusters,
    hasActiveSources,
    hasPublishVerdicts,
    sort,
    category,
    search: initialSearch,
    view,
    categories,
    meta,
    nextScrapeAt,
    nextAutoReviewAt,
    nextAutoAcceptAt,
    autoAccept,
    kpis,
}: Props) {
    const [search, setSearch] = useState(initialSearch ?? '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const {
        bulkAccept,
        bulkReject,
        processing: bulkProcessing,
    } = useBulkNewsClusterActions();

    // Solo se pueden seleccionar los pendientes; los ya aceptados no tienen
    // acción en lote (ya son un artículo).
    const selectableIds = clusters
        .filter((cluster) => cluster.status !== 'accepted')
        .map((cluster) => cluster.id);

    // Si cambia de página, categoría u orden, la selección anterior ya no
    // corresponde a lo que se ve en pantalla.
    useEffect(() => {
        setSelectedIds([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meta.current_page, category, sort]);

    const toggleSelected = (clusterId: number, selected: boolean) => {
        setSelectedIds((current) =>
            selected
                ? [...current, clusterId]
                : current.filter((id) => id !== clusterId),
        );
    };

    // Debounce: no buscamos en cada tecla, solo cuando el usuario deja de
    // escribir un rato — igual que en el buscador de comentarios.
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (search === (initialSearch ?? '')) {
                return;
            }

            router.get(
                index().url,
                {
                    sort,
                    ...(category ? { category } : {}),
                    ...(search ? { search } : {}),
                    ...(view !== 'pending' ? { view } : {}),
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['clusters', 'meta', 'search'],
                },
            );
        }, 400);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const goToPage = (page: number) => {
        router.get(
            index().url,
            {
                sort,
                ...(category ? { category } : {}),
                ...(search ? { search } : {}),
                ...(view !== 'pending' ? { view } : {}),
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['clusters', 'meta'],
            },
        );
    };

    const changeView = (nextView: string) => {
        setSelectedIds([]);
        router.get(
            index().url,
            {
                sort,
                ...(category ? { category } : {}),
                ...(search ? { search } : {}),
                view: nextView,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['clusters', 'meta', 'view'],
            },
        );
    };

    // Agrupa como un calendario ("Hoy", "Ayer", "Esta semana", "Más
    // antiguas") solo en la bandeja de pendientes — en "Publicadas" ya no
    // importa cuándo se detectaron, es solo un archivo de consulta.
    const groupedByDate =
        view === 'pending'
            ? DATE_BUCKET_ORDER.map((bucket) => ({
                  bucket,
                  label: DATE_BUCKET_LABELS[bucket],
                  items: clusters.filter(
                      (cluster) => cluster.date_bucket === bucket,
                  ),
              })).filter((group) => group.items.length > 0)
            : [{ bucket: 'all' as const, label: null, items: clusters }];

    return (
        <>
            <Head title="Revisar noticias" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Revisar noticias"
                        description="Noticias encontradas en tus fuentes activas. Acepta las que valen la pena o descarta el resto"
                    />
                    <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
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
                                Próximo análisis con IA: {nextAutoReviewAt.in} (
                                {nextAutoReviewAt.at})
                            </span>
                        )}
                        {autoAccept.enabled && nextAutoAcceptAt && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                Próxima aceptación automática:{' '}
                                {nextAutoAcceptAt.in} ({nextAutoAcceptAt.at})
                            </span>
                        )}
                    </div>
                )}

                <AutoAcceptControl
                    enabled={autoAccept.enabled}
                    dailyLimit={autoAccept.daily_limit}
                />

                <Tabs value={view} onValueChange={changeView}>
                    <TabsList>
                        <TabsTrigger value="pending">
                            Pendientes de revisar
                        </TabsTrigger>
                        <TabsTrigger value="published">
                            Ya publicadas
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <KpiCard
                        icon={Inbox}
                        label="En la bandeja"
                        value={kpis.total}
                    />
                    <KpiCard
                        icon={BadgeCheck}
                        label="Ya publicadas"
                        value={kpis.published}
                    />
                    <KpiCard
                        icon={Undo2}
                        label="Sin publicar todavía"
                        value={kpis.unpublished}
                        sublabel="Pendientes o aceptadas en borrador"
                    />
                    <KpiCard
                        icon={Sparkles}
                        label="Analizadas por IA"
                        value={kpis.analyzed}
                    />
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

                {clusters.length === 0 && !category && !search ? (
                    <p className="text-muted-foreground text-sm">
                        {view === 'pending'
                            ? 'No hay noticias pendientes de revisión. Prueba "Buscar noticias ahora" para traer novedades de tus fuentes activas.'
                            : 'Todavía no hay noticias publicadas desde esta bandeja.'}
                    </p>
                ) : (
                    <div className="space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                            <div className="relative w-full sm:max-w-xs sm:flex-1">
                                <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar por título..."
                                    className="pl-8"
                                />
                            </div>
                            <NewsReviewCategorySelect
                                value={category}
                                categories={categories}
                                sort={sort}
                                search={search || null}
                                view={view}
                            />
                            <NewsReviewSortSelect
                                value={sort}
                                category={category}
                                search={search || null}
                                view={view}
                            />
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="bg-muted flex flex-wrap items-center gap-2 rounded-md p-2">
                                <span className="px-1 text-sm font-medium">
                                    {selectedIds.length} seleccionada
                                    {selectedIds.length === 1 ? '' : 's'}
                                </span>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={bulkProcessing}
                                    onClick={() =>
                                        bulkAccept(selectedIds).finally(() =>
                                            setSelectedIds([]),
                                        )
                                    }
                                >
                                    Aceptar seleccionadas
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={bulkProcessing}
                                    onClick={() =>
                                        bulkReject(selectedIds).finally(() =>
                                            setSelectedIds([]),
                                        )
                                    }
                                >
                                    Descartar seleccionadas
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={bulkProcessing}
                                    onClick={() => setSelectedIds([])}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        )}

                        {clusters.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No hay noticias que coincidan con el filtro.
                            </p>
                        ) : (
                            <div className="space-y-6">
                                {groupedByDate.map((group) => (
                                    <div
                                        key={group.bucket}
                                        className="space-y-2"
                                    >
                                        {group.label && (
                                            <div className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
                                                <CalendarDays className="h-4 w-4" />
                                                {group.label}
                                                <span className="text-muted-foreground/70 font-normal">
                                                    ({group.items.length})
                                                </span>
                                            </div>
                                        )}
                                        <div className="overflow-x-auto rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-10">
                                                            <Checkbox
                                                                checked={
                                                                    selectableIds.length >
                                                                        0 &&
                                                                    selectableIds.every(
                                                                        (id) =>
                                                                            selectedIds.includes(
                                                                                id,
                                                                            ),
                                                                    )
                                                                }
                                                                onCheckedChange={(
                                                                    checked,
                                                                ) =>
                                                                    setSelectedIds(
                                                                        checked ===
                                                                            true
                                                                            ? selectableIds
                                                                            : [],
                                                                    )
                                                                }
                                                                aria-label="Seleccionar todas"
                                                            />
                                                        </TableHead>
                                                        <TableHead>
                                                            Tema
                                                        </TableHead>
                                                        <TableHead className="hidden md:table-cell">
                                                            Categoría
                                                        </TableHead>
                                                        <TableHead className="hidden md:table-cell">
                                                            Fuentes
                                                        </TableHead>
                                                        <TableHead className="hidden lg:table-cell">
                                                            Fecha
                                                        </TableHead>
                                                        <TableHead>
                                                            IA / Estado
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Acciones
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {group.items.map(
                                                        (cluster) => (
                                                            <NewsClusterRow
                                                                key={cluster.id}
                                                                cluster={
                                                                    cluster
                                                                }
                                                                selected={selectedIds.includes(
                                                                    cluster.id,
                                                                )}
                                                                onToggleSelected={
                                                                    toggleSelected
                                                                }
                                                                mergeCandidates={clusters.filter(
                                                                    (
                                                                        candidate,
                                                                    ) =>
                                                                        candidate.id !==
                                                                            cluster.id &&
                                                                        candidate.status !==
                                                                            'accepted' &&
                                                                        candidate.category ===
                                                                            cluster.category,
                                                                )}
                                                            />
                                                        ),
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                ))}
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
