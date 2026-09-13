import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import backupRoutes from '@/routes/admin/backup';

type RemoteBackup = {
    name: string;
    size: number;
    last_modified: number;
};

function readCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

export function useRemoteBackups(enabled: boolean) {
    const [backupsList, setBackupsList] = useState<RemoteBackup[]>([]);
    const [loading, setLoading] = useState(false);
    const [backingUp, setBackingUp] = useState(false);

    const load = () => {
        if (!enabled) {
            return;
        }

        setLoading(true);

        fetch(backupRoutes.remote.index().url, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then((response) => response.json())
            .then((data: { backups: RemoteBackup[] }) =>
                setBackupsList(data.backups),
            )
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);

    const backupNow = () => {
        setBackingUp(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.post(
                backupRoutes.remote.store().url,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        load();
                        resolve();
                    },
                    onError: () => reject(),
                    onFinish: () => setBackingUp(false),
                },
            );
        });

        toast.promise(promise, {
            loading: 'Generando y subiendo backup...',
            success: 'Backup subido a almacenamiento remoto',
            error: 'No se pudo generar el backup',
        });
    };

    const deleteBackup = (filename: string) => {
        const promise = new Promise<void>((resolve, reject) => {
            fetch(backupRoutes.remote.destroy(filename).url, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('No se pudo eliminar');
                    }
                    load();
                    resolve();
                })
                .catch(reject);
        });

        toast.promise(promise, {
            loading: 'Eliminando...',
            success: 'Backup eliminado',
            error: 'No se pudo eliminar el backup',
        });
    };

    return { backupsList, loading, backingUp, backupNow, deleteBackup };
}
