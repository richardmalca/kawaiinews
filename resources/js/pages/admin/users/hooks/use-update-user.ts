import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { update } from '@/routes/admin/users';

type UpdateUserData = {
    name: string;
    email: string;
    role: string;
};

export function useUpdateUser(onSuccess: () => void) {
    const [processing, setProcessing] = useState(false);

    const updateUser = (userId: number, data: UpdateUserData) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.put(update(userId).url, data, {
                preserveScroll: true,
                onSuccess: () => resolve(),
                onError: () => reject(),
                onFinish: () => setProcessing(false),
            });
        });

        toast.promise(promise, {
            loading: 'Actualizando usuario...',
            success: () => {
                onSuccess();

                return 'Usuario actualizado correctamente';
            },
            error: 'Revisa los campos e intenta nuevamente',
        });
    };

    return { updateUser, processing };
}
