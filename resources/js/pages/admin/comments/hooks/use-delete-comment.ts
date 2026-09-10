import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { destroy } from '@/routes/admin/comments';

export function useDeleteComment(onSuccess: () => void) {
    const [processing, setProcessing] = useState(false);

    const deleteComment = (commentId: number) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.delete(destroy(commentId).url, {
                preserveScroll: true,
                preserveState: true,
                only: ['comments', 'meta', 'kpis'],
                onSuccess: () => resolve(),
                onError: () => reject(),
                onFinish: () => setProcessing(false),
            });
        });

        toast.promise(promise, {
            loading: 'Eliminando comentario...',
            success: () => {
                onSuccess();

                return 'Comentario eliminado correctamente';
            },
            error: 'No se pudo eliminar el comentario',
        });
    };

    return { deleteComment, processing };
}
