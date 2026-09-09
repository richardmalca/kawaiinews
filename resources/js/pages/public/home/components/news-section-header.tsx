import { Link } from '@inertiajs/react';
import type { PublicCategorySummary } from '@/types';
import { Filter, Newspaper } from 'lucide-react';

interface NewsSectionHeaderProps {
    selectedCategory: string | null;
    categories: Record<string, PublicCategorySummary>;
    search?: string | null;
}

export function NewsSectionHeader({
    selectedCategory,
    categories,
    search,
}: NewsSectionHeaderProps) {
    let title = 'Últimas Noticias';
    let subtitle = 'Novedades y notas destacadas';

    if (search) {
        title = `Resultados para: "${search}"`;
        subtitle = 'Artículos que coinciden con tu búsqueda';
    } else if (selectedCategory) {
        title = `Categoría: ${categories[selectedCategory]?.label ?? selectedCategory}`;
        subtitle = 'Explora las publicaciones de esta sección';
    }

    return (
        <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-4 sm:flex-row sm:items-center dark:border-neutral-800">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10">
                    <Newspaper className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                        {title}
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {subtitle}
                    </p>
                </div>
            </div>

            {(selectedCategory || search) && (
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs text-rose-600 transition-colors hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
                >
                    <Filter className="h-3.5 w-3.5" />
                    <span>
                        {search
                            ? 'Limpiar búsqueda'
                            : 'Ver todas las categorías'}
                    </span>
                </Link>
            )}
        </div>
    );
}
