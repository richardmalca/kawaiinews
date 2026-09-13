import { Link } from '@inertiajs/react';
import {
    Check,
    EllipsisVertical,
    ExternalLink,
    HelpCircle,
    Merge,
    Pencil,
    Youtube,
    X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { TableCell, TableRow } from '@/components/ui/table';
import { useAcceptNewsCluster } from '@/pages/admin/news-review/hooks/use-accept-news-cluster';
import { useMergeNewsCluster } from '@/pages/admin/news-review/hooks/use-merge-news-cluster';
import { useRejectNewsCluster } from '@/pages/admin/news-review/hooks/use-reject-news-cluster';
import { edit } from '@/routes/admin/news-articles';
import type { NewsCluster } from '@/types/admin';

type Props = {
    cluster: NewsCluster;
    selected: boolean;
    onToggleSelected: (clusterId: number, selected: boolean) => void;
    mergeCandidates: NewsCluster[];
};

const credibilityVariant: Record<
    NonNullable<NewsCluster['ai_credibility']>,
    'default' | 'secondary' | 'destructive'
> = {
    alta: 'default',
    media: 'secondary',
    baja: 'destructive',
};

const credibilityLabel: Record<
    NonNullable<NewsCluster['ai_credibility']>,
    string
> = {
    alta: 'Credibilidad alta',
    media: 'Credibilidad media',
    baja: 'Credibilidad baja',
};

function RumorBadge({ cluster }: { cluster: NewsCluster }) {
    if (!cluster.ai_is_rumor) {
        return null;
    }

    return (
        <Badge
            variant={
                cluster.ai_credibility
                    ? credibilityVariant[cluster.ai_credibility]
                    : 'secondary'
            }
            className="gap-1"
            title="La IA estimó esto según cantidad/consistencia de fuentes, no es una verificación real de que el hecho sea cierto"
        >
            <HelpCircle className="h-3 w-3" />
            Rumor
            {cluster.ai_credibility &&
                ` · ${credibilityLabel[cluster.ai_credibility].replace('Credibilidad ', '')}`}
        </Badge>
    );
}

export default function NewsClusterRow({
    cluster,
    selected,
    onToggleSelected,
    mergeCandidates,
}: Props) {
    const { acceptCluster, processing: accepting } = useAcceptNewsCluster();
    const { rejectCluster, processing: rejecting } = useRejectNewsCluster();
    const { mergeCluster, processing: merging } = useMergeNewsCluster();
    const processing = accepting || rejecting || merging;
    const isAccepted = cluster.status === 'accepted';

    return (
        <TableRow data-state={selected ? 'selected' : undefined}>
            <TableCell>
                <Checkbox
                    checked={selected}
                    disabled={isAccepted}
                    onCheckedChange={(checked) =>
                        onToggleSelected(cluster.id, checked === true)
                    }
                    aria-label={`Seleccionar "${cluster.title}"`}
                />
            </TableCell>
            <TableCell className="max-w-48 sm:max-w-xs">
                <p
                    className="flex items-center gap-1.5 truncate font-medium"
                    title={cluster.title}
                >
                    {cluster.has_video && (
                        <Youtube
                            className="text-muted-foreground h-3.5 w-3.5 shrink-0"
                            aria-label="Trae trailer de YouTube"
                        />
                    )}
                    {cluster.title}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                    {cluster.sources.slice(0, 3).map((source) => (
                        <a
                            key={source.id}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs hover:underline"
                        >
                            <ExternalLink className="h-3 w-3" />
                            {source.source_label}
                        </a>
                    ))}
                </div>
                {/* En mobile, Categoría/Fuentes/Fecha están ocultas: las
                    mostramos acá abajo compactas para no perder contexto. */}
                <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-2 text-xs md:hidden">
                    <Badge variant="outline" className="capitalize">
                        {cluster.category}
                    </Badge>
                    <span>
                        {cluster.sources_count} fuente
                        {cluster.sources_count === 1 ? '' : 's'}
                    </span>
                    <span className="lg:hidden">
                        {cluster.published_at ?? cluster.first_seen_at}
                    </span>
                </div>
            </TableCell>
            <TableCell className="hidden capitalize md:table-cell">
                {cluster.category}
            </TableCell>
            <TableCell className="hidden md:table-cell">
                <Badge
                    variant={
                        cluster.sources_count > 1 ? 'default' : 'secondary'
                    }
                >
                    {cluster.sources_count}
                </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">
                {cluster.published_at ?? cluster.first_seen_at}
            </TableCell>
            <TableCell>
                <div className="flex flex-wrap gap-1">
                    {isAccepted && (
                        <Badge variant="outline">Ya en la página</Badge>
                    )}
                    {!isAccepted && cluster.ai_verdict && (
                        <Badge
                            variant={
                                cluster.ai_verdict === 'publish'
                                    ? 'default'
                                    : 'secondary'
                            }
                            title={cluster.ai_reason ?? undefined}
                        >
                            {cluster.ai_verdict === 'publish'
                                ? 'IA: Publicar'
                                : `IA: ${cluster.ai_reason ?? 'Descartar'}`}
                        </Badge>
                    )}
                    <RumorBadge cluster={cluster} />
                </div>
            </TableCell>
            <TableCell className="text-right">
                {isAccepted && cluster.article_id ? (
                    <Button type="button" variant="outline" size="sm" asChild>
                        <Link href={edit(cluster.article_id).url}>
                            <Pencil className="h-4 w-4" />
                            Editar
                        </Link>
                    </Button>
                ) : (
                    <div className="flex justify-end gap-1">
                        <Button
                            type="button"
                            size="sm"
                            disabled={processing}
                            onClick={() => acceptCluster(cluster.id)}
                        >
                            {accepting ? (
                                <Spinner />
                            ) : (
                                <Check className="h-4 w-4" />
                            )}
                            <span className="sr-only">Aceptar</span>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={processing}
                            onClick={() => rejectCluster(cluster.id)}
                        >
                            {rejecting ? (
                                <Spinner />
                            ) : (
                                <X className="h-4 w-4" />
                            )}
                            <span className="sr-only">Descartar</span>
                        </Button>
                        {mergeCandidates.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={processing}
                                        title="Fusionar con otra noticia duplicada"
                                    >
                                        <EllipsisVertical className="h-4 w-4" />
                                        <span className="sr-only">
                                            Más acciones
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {mergeCandidates.map((candidate) => (
                                        <DropdownMenuItem
                                            key={candidate.id}
                                            onSelect={() =>
                                                mergeCluster(
                                                    cluster.id,
                                                    candidate.id,
                                                )
                                            }
                                        >
                                            <Merge className="h-4 w-4" />
                                            <span className="line-clamp-1">
                                                Fusionar con "
                                                {candidate.title}"
                                            </span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                )}
            </TableCell>
        </TableRow>
    );
}
