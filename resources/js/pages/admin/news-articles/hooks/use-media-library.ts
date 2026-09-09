import { useState } from 'react';
import { toast } from 'sonner';
import {
    destroy,
    generate,
    index,
    store,
    storeFromUrl,
} from '@/routes/admin/media';
import type { MediaItem } from '@/types/admin';

function readCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

export function useMediaLibrary() {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

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
            toast.error('No se pudo cargar la biblioteca de medios');
        } finally {
            setLoading(false);
        }
    };

    const uploadFile = async (
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
                throw new Error('upload failed');
            }

            const media = (await response.json()) as MediaItem;
            setItems((current) => [media, ...current]);
            toast.success('Imagen subida a la biblioteca');

            return media;
        } catch {
            toast.error('No se pudo subir la imagen');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const addFromUrl = async (
        url: string,
        newsArticleId: number | null = null,
    ) => {
        setUploading(true);

        try {
            const response = await fetch(storeFromUrl().url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
                body: JSON.stringify({ url, news_article_id: newsArticleId }),
            });

            if (!response.ok) {
                throw new Error('add failed');
            }

            const media = (await response.json()) as MediaItem;
            setItems((current) => [media, ...current]);
            toast.success('Imagen agregada a la biblioteca');

            return media;
        } catch {
            toast.error('No se pudo agregar la imagen desde esa URL');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const generateWithAi = async (
        prompt: string,
        newsArticleId: number | null = null,
    ) => {
        setUploading(true);

        try {
            const response = await fetch(generate().url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
                body: JSON.stringify({
                    prompt,
                    news_article_id: newsArticleId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message ?? 'No se pudo generar la imagen');
            }

            const media = data as MediaItem;
            setItems((current) => [media, ...current]);
            toast.success('Imagen generada con IA');

            return media;
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'No se pudo generar la imagen',
            );
            return null;
        } finally {
            setUploading(false);
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
            toast.success('Imagen eliminada de la biblioteca');
        } catch {
            toast.error('No se pudo eliminar la imagen');
        }
    };

    return {
        items,
        loading,
        uploading,
        loadItems,
        uploadFile,
        addFromUrl,
        generateWithAi,
        deleteItem,
    };
}
