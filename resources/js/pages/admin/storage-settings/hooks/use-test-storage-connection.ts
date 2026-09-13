import { router, useHttp } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { testConnection as testConnectionRoute } from '@/routes/admin/storage-settings';

type TestConnectionResult = {
    success: boolean;
    message: string;
};

export function useTestStorageConnection() {
    const { submit } = useHttp();
    const [processing, setProcessing] = useState(false);

    const testConnection = () => {
        setProcessing(true);

        const promise = (
            submit(testConnectionRoute()) as Promise<TestConnectionResult>
        )
            .then((result) => {
                if (!result.success) {
                    throw new Error(result.message);
                }

                return result;
            })
            .finally(() => {
                setProcessing(false);
                router.reload({ only: ['settings'] });
            });

        toast.promise(promise, {
            loading: 'Probando conexión...',
            success: (result: TestConnectionResult) => result.message,
            error: (error: Error) => error.message,
        });
    };

    return { testConnection, processing };
}
