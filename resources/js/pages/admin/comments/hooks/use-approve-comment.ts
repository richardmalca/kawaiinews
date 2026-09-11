import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { approve } from '@/routes/admin/comments';

export function useApproveComment() {
    const [processing, setProcessing] = useState(false);

    const approveComment = (commentId: number) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.post(approve(commentId).url, undefined, {
                preserveScroll: true,
                preserveState: true,
                only: ['comments', 'meta', 'kpis'],
                onSuccess: () => resolve(),
                onError: () => reject(),
                onFinish: () => setProcessing(false),
            });
        });

        toast.promise(promise, {
            loading: 'Aprobando comentario...',
            success: 'Comentario aprobado, ya es visible para el público',
            error: 'No se pudo aprobar el comentario',
        });
    };

    return { approveComment, processing };
}
