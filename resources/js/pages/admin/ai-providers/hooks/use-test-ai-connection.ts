import { router, useHttp } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { test } from '@/routes/admin/ai-providers';

type TestConnectionResult = {
    success: boolean;
    message: string;
};

export function useTestAiConnection() {
    const { submit } = useHttp();
    const [processing, setProcessing] = useState(false);

    const testConnection = (providerId: number) => {
        setProcessing(true);

        const promise = (submit(test(providerId)) as Promise<TestConnectionResult>)
            .then((result) => {
                if (!result.success) {
                    throw new Error(result.message);
                }

                return result;
            })
            .finally(() => {
                setProcessing(false);
                router.reload({ only: ['providers'] });
            });

        toast.promise(promise, {
            loading: 'Probando conexión...',
            success: (result: TestConnectionResult) => result.message,
            error: (error: Error) => error.message,
        });
    };

    return { testConnection, processing };
}
