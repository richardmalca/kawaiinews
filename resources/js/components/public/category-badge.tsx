const categoryColorMap: Record<string, string> = {
    anime: 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
    manga: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
    gaming: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
    geek: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20',
    japon: 'bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20',
    peliculas:
        'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20 hover:bg-fuchsia-500/20',
};

interface CategoryBadgeProps {
    category: string;
    label?: string;
    className?: string;
}

export function getCategoryBadgeStyle(category: string): string {
    return (
        categoryColorMap[category.toLowerCase()] ??
        'bg-neutral-800 text-neutral-300 border-neutral-700'
    );
}

export function CategoryBadge({
    category,
    label,
    className = '',
}: CategoryBadgeProps) {
    const style = getCategoryBadgeStyle(category);

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wider uppercase transition-colors ${style} ${className}`}
        >
            {label ?? category}
        </span>
    );
}
