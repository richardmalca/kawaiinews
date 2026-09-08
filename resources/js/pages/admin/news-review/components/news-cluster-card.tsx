import { Check, ExternalLink, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAcceptNewsCluster } from '@/pages/admin/news-review/hooks/use-accept-news-cluster';
import { useRejectNewsCluster } from '@/pages/admin/news-review/hooks/use-reject-news-cluster';
import type { NewsCluster } from '@/types/admin';

type Props = {
    cluster: NewsCluster;
};

export default function NewsClusterCard({ cluster }: Props) {
    const { acceptCluster, processing: accepting } = useAcceptNewsCluster();
    const { rejectCluster, processing: rejecting } = useRejectNewsCluster();
    const processing = accepting || rejecting;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2">
                    <span>{cluster.title}</span>
                    <Badge variant={cluster.sources_count > 1 ? 'default' : 'secondary'}>
                        {cluster.sources_count}{' '}
                        {cluster.sources_count === 1 ? 'fuente' : 'fuentes'}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {cluster.summary && (
                    <p className="text-muted-foreground text-sm">
                        {cluster.summary}
                    </p>
                )}
                <div className="flex flex-wrap gap-2">
                    {cluster.sources.map((source) => (
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
                {cluster.first_seen_at && (
                    <p className="text-muted-foreground text-xs">
                        Visto por primera vez: {cluster.first_seen_at}
                    </p>
                )}
            </CardContent>
            <CardFooter className="gap-2">
                <Button
                    type="button"
                    disabled={processing}
                    onClick={() => acceptCluster(cluster.id)}
                >
                    {accepting ? <Spinner /> : <Check />}
                    Aceptar
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    disabled={processing}
                    onClick={() => rejectCluster(cluster.id)}
                >
                    {rejecting ? <Spinner /> : <X />}
                    Descartar
                </Button>
            </CardFooter>
        </Card>
    );
}
