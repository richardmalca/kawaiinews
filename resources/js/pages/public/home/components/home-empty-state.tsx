import { Sparkles } from 'lucide-react';

export function HomeEmptyState() {
    return (
        <div className="rounded-3xl border border-neutral-200 bg-white p-12 text-center shadow-xs dark:border-neutral-800 dark:bg-neutral-900/30 dark:shadow-none">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-neutral-400 dark:text-neutral-600" />
            <h3 className="mb-1 text-sm font-semibold text-neutral-800 dark:text-neutral-300">
                No hay más noticias publicadas en esta sección
            </h3>
            <p className="mx-auto max-w-sm text-xs text-neutral-500">
                Nuevos temas están siendo procesados en la bandeja de revisión.
            </p>
        </div>
    );
}
