import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationLinks {
    prev?: string | null;
    next?: string | null;
}

interface HomePaginationProps {
    links?: PaginationLinks;
}

export function HomePagination({ links }: HomePaginationProps) {
    if (!links || (!links.prev && !links.next)) {
        return null;
    }

    return (
        <div className="flex items-center justify-between border-t border-neutral-200 pt-6 dark:border-neutral-800/80">
            {links.prev ? (
                <Link
                    href={links.prev}
                    className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 shadow-xs transition-colors hover:bg-neutral-100 hover:text-neutral-950 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:shadow-none dark:hover:bg-neutral-800 dark:hover:text-white"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Anterior
                </Link>
            ) : (
                <div />
            )}

            {links.next ? (
                <Link
                    href={links.next}
                    className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 shadow-xs transition-colors hover:bg-neutral-100 hover:text-neutral-950 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:shadow-none dark:hover:bg-neutral-800 dark:hover:text-white"
                >
                    Siguiente
                    <ChevronRight className="h-3.5 w-3.5" />
                </Link>
            ) : (
                <div />
            )}
        </div>
    );
}
