import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useDeleteNewsArticle } from '@/pages/admin/news-articles/hooks/use-delete-news-article';
import type { NewsArticle } from '@/types/admin';

type Props = {
    article: NewsArticle;
    afterDelete?: () => void;
};

export default function DeleteNewsArticleDialog({
    article,
    afterDelete,
}: Props) {
    const { deleteArticle, processing } = useDeleteNewsArticle();

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar noticia</AlertDialogTitle>
                    <AlertDialogDescription>
                        ¿Estás seguro de que quieres eliminar "{article.title}
                        "? Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={processing}
                        onClick={() =>
                            deleteArticle(article.id, () => {
                                afterDelete?.();
                                router.reload({ only: ['articles'] });
                            })
                        }
                    >
                        Eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
