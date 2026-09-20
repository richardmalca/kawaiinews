import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { waitForJobRun } from '@/lib/job-run';
import { rebuildQueue } from '@/routes/admin/radio';
import { destroy, store } from '@/routes/admin/radio/tracks';
import type { RadioQueueItem, RadioTrack } from '@/types/admin';

function readCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

export function useRadio(initialTracks: RadioTrack[], queue: RadioQueueItem[]) {
    const [tracks, setTracks] = useState(initialTracks);
    const [uploading, setUploading] = useState(false);
    const [rebuilding, setRebuilding] = useState(false);

    const uploadTrack = async (file: File, title: string, artist: string) => {
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', title);

            if (artist) {
                formData.append('artist', artist);
            }

            const response = await fetch(store().url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message ?? 'No se pudo subir la pista');
            }

            const track = (await response.json()) as RadioTrack;
            setTracks((current) => [track, ...current]);
            toast.success('Pista agregada a KawaiiRadio');

            return track;
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'No se pudo subir la pista',
            );
            return null;
        } finally {
            setUploading(false);
        }
    };

    const deleteTrack = async (track: RadioTrack) => {
        try {
            const response = await fetch(destroy(track.id).url, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
            });

            if (!response.ok) {
                throw new Error('delete failed');
            }

            setTracks((current) => current.filter((t) => t.id !== track.id));
            toast.success('Pista eliminada');
        } catch {
            toast.error('No se pudo eliminar la pista');
        }
    };

    const rebuild = async () => {
        setRebuilding(true);

        const promise = fetch(rebuildQueue().url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-XSRF-TOKEN': readCsrfToken(),
            },
        })
            .then((response) => response.json())
            .then((queued: { run_id?: string }) => {
                if (!queued.run_id) {
                    throw new Error('No se pudo reconstruir la cola');
                }

                // Puede llamar a la IA una vez por noticia nueva sin frase
                // del DJ todavía (hasta 8), le damos más margen que el
                // default de 3 minutos.
                return waitForJobRun<{
                    queued: number;
                    skipped_no_audio: number;
                    skipped_no_music: boolean;
                }>(queued.run_id, 6 * 60 * 1000);
            })
            .then((result) => {
                if (result.skipped_no_music) {
                    throw new Error(
                        'No hay ninguna pista de música activa — subí al menos una primero',
                    );
                }

                return result;
            })
            .finally(() => setRebuilding(false));

        toast.promise(promise, {
            loading: 'Reconstruyendo la cola de KawaiiRadio...',
            success: (result) => `Cola lista: ${result.queued} item(s)`,
            error: (error: Error) => error.message,
        });

        const result = await promise.catch(() => null);

        if (result) {
            router.reload({ only: ['queue'] });
        }
    };

    return {
        tracks,
        queue,
        uploading,
        rebuilding,
        uploadTrack,
        deleteTrack,
        rebuild,
    };
}
