import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import NewsSourceRow from '@/pages/admin/news-sources/components/news-source-row';
import type { NewsSourceGroup } from '@/types/admin';

type Props = {
    group: NewsSourceGroup;
};

export default function NewsSourceCategoryCard({ group }: Props) {
    const activeCount = group.sources.filter((s) => s.is_active).length;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                    {group.label}
                    <Badge variant={activeCount > 0 ? 'default' : 'secondary'}>
                        {activeCount} / {group.sources.length} activas
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {group.sources.map((source) => (
                    <NewsSourceRow key={source.id} source={source} />
                ))}
            </CardContent>
        </Card>
    );
}
