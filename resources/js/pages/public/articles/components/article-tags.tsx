import { Tag as TagIcon } from 'lucide-react';

interface ArticleTagsProps {
    tags: string[];
}

export function ArticleTags({ tags }: ArticleTagsProps) {
    if (!tags || tags.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <span className="flex items-center gap-1 text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                <TagIcon className="h-3.5 w-3.5" />
                Etiquetas:
            </span>
            {tags.map((tag) => (
                <span
                    key={tag}
                    className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                >
                    #{tag}
                </span>
            ))}
        </div>
    );
}
