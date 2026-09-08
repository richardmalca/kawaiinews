import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { destroy } from '@/routes/admin/users';

export function useDeleteUser(onSuccess: () => void) {
    const [processing, setProcessing] = useState(false);

    const deleteUser = (userId: number) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.delete(destroy(userId).url, {
                preserveScroll: true,
                onSuccess: () => resolve(),
                onError: () => reject(),
                onFinish: () => setProcessing(false),
            });
        });

        toast.promise(promise, {
            loading: 'Eliminando usuario...',
            success: () => {
                onSuccess();

                return 'Usuario eliminado correctamente';
            },
            error: 'No se pudo eliminar el usuario',
        });
    };

    return { deleteUser, processing };
}
