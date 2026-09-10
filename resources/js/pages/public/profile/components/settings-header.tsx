import { Link } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';

interface SettingsHeaderProps {
    username?: string | null;
}

export function SettingsHeader({ username }: SettingsHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <Link
                href={username ? `/perfil/${username}` : '/'}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>
                    <span className="sm:hidden">Volver</span>
                    <span className="hidden sm:inline">
                        {username ? 'Volver a mi perfil' : 'Volver a la portada'}
                    </span>
                </span>
            </Link>

            {username && (
                <Link
                    href={`/perfil/${username}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
                >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Ver perfil público</span>
                </Link>
            )}
        </div>
    );
}
