import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toggleStatus } from '@/routes/admin/news-articles';
import type { NewsArticle } from '@/types/admin';

type Props = {
    article: NewsArticle;
};

export default function NewsArticleStatusToggleCell({ article }: Props) {
    const [processing, setProcessing] = useState(false);
    const nextStatus =
        article.status === 'published' ? 'Borrador' : 'Publicada';

    const toggle = () => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.post(toggleStatus(article.id).url, undefined, {
                preserveScroll: true,
                preserveState: true,
                only: ['articles'],
                onSuccess: () => resolve(),
                onError: () => reject(),
                onFinish: () => setProcessing(false),
            });
        });

        toast.promise(promise, {
            loading: `Cambiando a ${nextStatus.toLowerCase()}...`,
            success: `Noticia marcada como ${nextStatus.toLowerCase()}`,
            error: 'No se pudo cambiar el estado',
        });
    };

    return (
        <Button
            type="button"
            variant={article.status === 'published' ? 'default' : 'secondary'}
            size="sm"
            disabled={processing}
            onClick={toggle}
        >
            {processing && <Spinner />}
            {article.status === 'published' ? 'Publicada' : 'Borrador'}
        </Button>
    );
}
