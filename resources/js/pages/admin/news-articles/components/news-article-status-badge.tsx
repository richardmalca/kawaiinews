import { Badge } from '@/components/ui/badge';
import type { NewsArticle } from '@/types/admin';

type Props = {
    status: NewsArticle['status'];
};

export default function NewsArticleStatusBadge({ status }: Props) {
    return (
        <Badge variant={status === 'published' ? 'default' : 'secondary'}>
            {status === 'published' ? 'Publicada' : 'Borrador'}
        </Badge>
    );
}
