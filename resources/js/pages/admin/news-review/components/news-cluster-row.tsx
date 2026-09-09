import { Link } from '@inertiajs/react';
import { Check, ExternalLink, Pencil, Youtube, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { TableCell, TableRow } from '@/components/ui/table';
import { useAcceptNewsCluster } from '@/pages/admin/news-review/hooks/use-accept-news-cluster';
import { useRejectNewsCluster } from '@/pages/admin/news-review/hooks/use-reject-news-cluster';
import { edit } from '@/routes/admin/news-articles';
import type { NewsCluster } from '@/types/admin';

type Props = {
    cluster: NewsCluster;
};

export default function NewsClusterRow({ cluster }: Props) {
    const { acceptCluster, processing: accepting } = useAcceptNewsCluster();
    const { rejectCluster, processing: rejecting } = useRejectNewsCluster();
    const processing = accepting || rejecting;
    const isAccepted = cluster.status === 'accepted';

    return (
        <TableRow>
            <TableCell className="max-w-xs">
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
            </TableCell>
            <TableCell className="capitalize">{cluster.category}</TableCell>
            <TableCell>
                <Badge
                    variant={
                        cluster.sources_count > 1 ? 'default' : 'secondary'
                    }
                >
                    {cluster.sources_count}
                </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
                {cluster.published_at ?? cluster.first_seen_at}
            </TableCell>
            <TableCell>
                {isAccepted && <Badge variant="outline">Ya en la página</Badge>}
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
                    </div>
                )}
            </TableCell>
        </TableRow>
    );
}
