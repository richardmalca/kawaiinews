import { Head, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { index } from '@/routes/admin/activity-log';

type ActivityLogEntry = {
    id: number;
    action: string;
    description: string | null;
    user: string;
    created_at_formatted: string;
};

type Meta = {
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    logs: ActivityLogEntry[];
    meta: Meta;
};

// Prefijo antes del primer punto (ej: "news_cluster.accepted" -> "news_cluster")
// para darle color por tipo de entidad, sin tener que mantener un mapa 1 a 1
// con cada acción puntual que se vaya agregando.
const categoryVariant: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    news_cluster: 'default',
    news_article: 'secondary',
    comment: 'destructive',
    site_settings: 'outline',
};

// Etiqueta legible por acción puntual; si se agrega una acción nueva y
// todavía no tiene traducción, cae al string técnico ("news_cluster.foo")
// en vez de romper — no hace falta actualizar esto para que algo nuevo
// aparezca en el log.
const actionLabels: Record<string, string> = {
    'news_cluster.accepted': 'Aceptó una noticia',
    'news_cluster.rejected': 'Descartó una noticia',
    'news_cluster.restored': 'Deshizo un descarte',
    'news_cluster.merged': 'Fusionó noticias duplicadas',
    'news_article.created': 'Creó un artículo',
    'news_article.updated': 'Editó un artículo',
    'news_article.status_toggled': 'Cambió el estado de un artículo',
    'news_article.deleted': 'Eliminó un artículo',
    'comment.approved': 'Aprobó un comentario',
    'comment.deleted': 'Eliminó un comentario',
    'site_settings.updated': 'Actualizó la configuración del sitio',
    'site_settings.logo_updated': 'Cambió el logo',
    'site_settings.logo_removed': 'Quitó el logo',
    'site_settings.favicon_updated': 'Cambió el favicon',
    'site_settings.og_image_updated': 'Cambió la imagen de OpenGraph',
    'site_settings.search_box_toggled': 'Cambió el buscador de Google',
};

function ActionBadge({ action }: { action: string }) {
    const category = action.split('.')[0];

    return (
        <Badge
            variant={categoryVariant[category] ?? 'outline'}
            className="shrink-0"
            title={action}
        >
            {actionLabels[action] ?? action}
        </Badge>
    );
}

function ActivityLogRow({ log }: { log: ActivityLogEntry }) {
    return (
        <TableRow>
            <TableCell className="max-w-64 sm:max-w-sm">
                <div className="flex items-start gap-2">
                    <ActionBadge action={log.action} />
                    <p className="line-clamp-2 text-sm break-words">
                        {log.description ?? '—'}
                    </p>
                </div>
                {/* En mobile, Quién/Cuándo están ocultas: las mostramos
                    acá abajo compactas para no perder el contexto. */}
                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs sm:hidden">
                    <span className="font-medium">{log.user}</span>
                    <span>{log.created_at_formatted}</span>
                </div>
            </TableCell>
            <TableCell className="hidden text-sm font-medium sm:table-cell">
                {log.user}
            </TableCell>
            <TableCell className="text-muted-foreground hidden text-sm whitespace-nowrap sm:table-cell">
                {log.created_at_formatted}
            </TableCell>
        </TableRow>
    );
}

export default function ActivityLogIndex({ logs, meta }: Props) {
    const goToPage = (page: number) => {
        router.get(
            index().url,
            { page },
            { preserveState: true, preserveScroll: true, only: ['logs', 'meta'] },
        );
    };

    return (
        <>
            <Head title="Actividad" />

            <div className="space-y-6 p-4">
                <Heading
                    title="Actividad"
                    description="Quién hizo qué en el panel: aceptar/descartar noticias, editar artículos, moderar comentarios"
                />

                {logs.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        Todavía no hay actividad registrada.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Actividad</TableHead>
                                    <TableHead className="hidden sm:table-cell">
                                        Quién
                                    </TableHead>
                                    <TableHead className="hidden sm:table-cell">
                                        Cuándo
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <ActivityLogRow key={log.id} log={log} />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

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

ActivityLogIndex.layout = {
    breadcrumbs: [
        {
            title: 'Actividad',
            href: '/admin/activity-log',
        },
    ],
};
