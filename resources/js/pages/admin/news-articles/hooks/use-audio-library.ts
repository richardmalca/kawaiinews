import { useState } from 'react';
import { toast } from 'sonner';
import { generateAudio } from '@/actions/App/Http/Controllers/Admin/MediaLibraryController';
import { waitForJobRun } from '@/lib/job-run';
import { destroy } from '@/routes/admin/media';
import { index, store } from '@/routes/admin/audio';
import type { MediaItem } from '@/types/admin';

function readCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

export function useAudioLibrary() {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);

    const loadItems = async () => {
        setLoading(true);

        try {
            const response = await fetch(index().url, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            const data = (await response.json()) as MediaItem[];
            setItems(data);
        } catch {
            toast.error('No se pudo cargar la biblioteca de audios');
        } finally {
            setLoading(false);
        }
    };

    const uploadAudio = async (
        file: File,
        newsArticleId: number | null = null,
    ) => {
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            if (newsArticleId) {
                formData.append('news_article_id', String(newsArticleId));
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
                throw new Error(data?.message ?? 'upload failed');
            }

            const media = (await response.json()) as MediaItem;
            setItems((current) => [media, ...current]);
            toast.success('Audio subido a la biblioteca');

            return media;
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'No se pudo subir el audio',
            );
            return null;
        } finally {
            setUploading(false);
        }
    };

    const generateForArticle = async (articleId: number) => {
        setGenerating(true);

        try {
            const response = await fetch(generateAudio(articleId).url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
            });

            const queued = await response.json();

            if (!response.ok || !queued.run_id) {
                throw new Error(queued.message ?? 'No se pudo generar el audio');
            }

            const media = await waitForJobRun<MediaItem>(queued.run_id);
            setItems((current) => [media, ...current]);
            toast.success('Audio generado');

            return media;
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'No se pudo generar el audio',
            );
            return null;
        } finally {
            setGenerating(false);
        }
    };

    const deleteItem = async (media: MediaItem) => {
        try {
            const response = await fetch(destroy(media.id).url, {
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

            setItems((current) =>
                current.filter((item) => item.id !== media.id),
            );
            toast.success('Audio eliminado de la biblioteca');
        } catch {
            toast.error('No se pudo eliminar el audio');
        }
    };

    return {
        items,
        loading,
        uploading,
        generating,
        loadItems,
        uploadAudio,
        generateForArticle,
        deleteItem,
    };
}
