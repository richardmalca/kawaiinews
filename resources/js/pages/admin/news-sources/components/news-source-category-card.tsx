import { PowerOff, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import NewsSourceRow from '@/pages/admin/news-sources/components/news-source-row';
import { useToggleCategoryNewsSources } from '@/pages/admin/news-sources/hooks/use-toggle-category-news-sources';
import type { NewsSourceGroup } from '@/types/admin';

type Props = {
    group: NewsSourceGroup;
};

export default function NewsSourceCategoryCard({ group }: Props) {
    const activeCount = group.sources.filter((s) => s.is_active).length;
    const { activateCategory, deactivateCategory, processing } =
        useToggleCategoryNewsSources();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                    {group.label}
                    <Badge variant={activeCount > 0 ? 'default' : 'secondary'}>
                        {activeCount} / {group.sources.length} activas
                    </Badge>
                </CardTitle>
                <div className="flex gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={processing}
                        onClick={() =>
                            activateCategory(group.category, group.label)
                        }
                    >
                        <Zap />
                        Activar todas
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={processing}
                        onClick={() =>
                            deactivateCategory(group.category, group.label)
                        }
                    >
                        <PowerOff />
                        Desactivar todas
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {group.sources.map((source) => (
                    <NewsSourceRow key={source.id} source={source} />
                ))}
            </CardContent>
        </Card>
    );
}
