import { ExternalLink, Rss } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import DeleteNewsSourceDialog from '@/pages/admin/news-sources/components/delete-news-source-dialog';
import EditNewsSourceDialog from '@/pages/admin/news-sources/components/edit-news-source-dialog';
import { useToggleNewsSource } from '@/pages/admin/news-sources/hooks/use-toggle-news-source';
import type { NewsSource } from '@/types/admin';

type Props = {
    source: NewsSource;
};

export default function NewsSourceRow({ source }: Props) {
    const { toggleSource, processing } = useToggleNewsSource();

    return (
        <div
            className={cn(
                'flex items-center justify-between gap-3 border-b p-3 last:border-b-0',
                source.is_active && 'bg-primary/5',
            )}
        >
            <div className="flex min-w-0 items-center gap-3">
                <Switch
                    checked={source.is_active}
                    disabled={processing}
                    onCheckedChange={() =>
                        toggleSource(source.id, !source.is_active)
                    }
                />
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="truncate font-medium">
                            {source.label}
                        </p>
                        {source.is_active && (
                            <Badge variant="default">Activa</Badge>
                        )}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-3 text-xs">
                        <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 hover:underline"
                        >
                            <ExternalLink className="h-3 w-3" />
                            {new URL(source.url).hostname}
                        </a>
                        {source.rss_url && (
                            <span className="flex items-center gap-1">
                                <Rss className="h-3 w-3" />
                                RSS
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
                <EditNewsSourceDialog source={source} />
                <DeleteNewsSourceDialog source={source} />
            </div>
        </div>
    );
}
