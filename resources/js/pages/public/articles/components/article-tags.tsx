import { Link } from '@inertiajs/react';
import { Tag as TagIcon } from 'lucide-react';

interface ArticleTagsProps {
    tags?: string[];
    tagItems?: {
        id?: number;
        name: string;
        slug: string;
    }[];
}

export function ArticleTags({ tags = [], tagItems }: ArticleTagsProps) {
    // If structured tag items are provided, prioritize them
    if (tagItems && tagItems.length > 0) {
        return (
            <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-6 dark:border-neutral-800">
                <span className="flex items-center gap-1 text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                    <TagIcon className="h-3.5 w-3.5" />
                    Etiquetas:
                </span>
                {tagItems.map((item) => (
                    <Link
                        key={item.slug}
                        href={`/tag/${item.slug}`}
                        className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 transition-all hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/20 dark:hover:text-rose-400"
                    >
                        #{item.name}
                    </Link>
                ))}
            </div>
        );
    }

    if (!tags || tags.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <span className="flex items-center gap-1 text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                <TagIcon className="h-3.5 w-3.5" />
                Etiquetas:
            </span>
            {tags.map((tag) => {
                const slug = tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                return (
                    <Link
                        key={tag}
                        href={`/tag/${slug}`}
                        className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 transition-all hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/20 dark:hover:text-rose-400"
                    >
                        #{tag}
                    </Link>
                );
            })}
        </div>
    );
}
