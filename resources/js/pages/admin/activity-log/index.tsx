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
const categoryVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
    news_cluster: 'default',
    news_article: 'secondary',
    comment: 'destructive',
};

function ActionBadge({ action }: { action: string }) {
    const category = action.split('.')[0];

    return (
        <Badge variant={categoryVariant[category] ?? 'outline'}>
            {action}
        </Badge>
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
                                    <TableHead>Cuándo</TableHead>
                                    <TableHead>Quién</TableHead>
                                    <TableHead>Acción</TableHead>
                                    <TableHead>Detalle</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                            {log.created_at_formatted}
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">
                                            {log.user}
                                        </TableCell>
                                        <TableCell>
                                            <ActionBadge action={log.action} />
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {log.description ?? '—'}
                                        </TableCell>
                                    </TableRow>
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
