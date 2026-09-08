import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { store } from '@/routes/admin/users';

type CreateUserData = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: string;
};

export function useCreateUser(onSuccess: () => void) {
    const [processing, setProcessing] = useState(false);

    const createUser = (data: CreateUserData) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.post(store().url, data, {
                preserveScroll: true,
                onSuccess: () => resolve(),
                onError: () => reject(),
                onFinish: () => setProcessing(false),
            });
        });

        toast.promise(promise, {
            loading: 'Creando usuario...',
            success: () => {
                onSuccess();

                return 'Usuario creado correctamente';
            },
            error: 'Revisa los campos e intenta nuevamente',
        });
    };

    return { createUser, processing };
}
