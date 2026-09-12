import { Bookmark } from 'lucide-react';
import { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { openChooseUsernameModal } from '@/lib/username-rules';
import { readCsrfToken } from '@/pages/public/profile/lib/profile-utils';

interface QuickFavoriteButtonProps {
    slug: string;
    initialFavorited?: boolean;
    initialCount?: number;
    className?: string;
    showCount?: boolean;
}

export function QuickFavoriteButton({
    slug,
    initialFavorited = false,
    initialCount = 0,
    className = '',
    showCount = false,
}: QuickFavoriteButtonProps) {
    const { auth } = usePage().props;
    const isAuthenticated = Boolean(auth.user);
    const hasUsername = Boolean(auth.user?.username);

    const [favorited, setFavorited] = useState(initialFavorited);
    const [count, setCount] = useState(initialCount);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            router.visit('/login');
            return;
        }

        if (!hasUsername) {
            openChooseUsernameModal();
            return;
        }

        if (isLoading) return;

        setIsLoading(true);
        const prevFavorited = favorited;
        const prevCount = count;

        setFavorited(!prevFavorited);
        setCount(prevFavorited ? Math.max(0, prevCount - 1) : prevCount + 1);

        try {
            const res = await fetch(`/noticias/${slug}/favorito`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
                credentials: 'same-origin',
            });

            if (!res.ok) {
                setFavorited(prevFavorited);
                setCount(prevCount);
                toast.error('No se pudo guardar');
                return;
            }

            const data = (await res.json()) as { favorited: boolean };
            setFavorited(data.favorited);
            if (data.favorited) {
                toast.success('Guardado en favoritos');
            } else {
                toast('Eliminado de favoritos');
            }
        } catch {
            setFavorited(prevFavorited);
            setCount(prevCount);
            toast.error('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            disabled={isLoading}
            title={favorited ? 'Eliminar de favoritos' : 'Guardar en favoritos'}
            aria-label="Guardar en favoritos"
            className={`inline-flex items-center justify-center transition-all duration-200 active:scale-90 ${className}`}
        >
            <Bookmark
                className={`h-4 w-4 transition-colors ${
                    favorited
                        ? 'fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400'
                        : 'text-neutral-500 hover:text-amber-500 dark:text-neutral-400 dark:hover:text-amber-400'
                }`}
            />
            {showCount && (
                <span className="ml-1 text-[11px] font-semibold">{count}</span>
            )}
        </button>
    );
}
