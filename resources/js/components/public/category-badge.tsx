const categoryColorMap: Record<string, string> = {
    anime: 'bg-rose-600/90 text-white border-rose-400/40 shadow-sm shadow-rose-950/20 backdrop-blur-md hover:bg-rose-600',
    manga: 'bg-amber-600/90 text-white border-amber-400/40 shadow-sm shadow-amber-950/20 backdrop-blur-md hover:bg-amber-600',
    gaming: 'bg-emerald-600/90 text-white border-emerald-400/40 shadow-sm shadow-emerald-950/20 backdrop-blur-md hover:bg-emerald-600',
    geek: 'bg-cyan-600/90 text-white border-cyan-400/40 shadow-sm shadow-cyan-950/20 backdrop-blur-md hover:bg-cyan-600',
    japon: 'bg-violet-600/90 text-white border-violet-400/40 shadow-sm shadow-violet-950/20 backdrop-blur-md hover:bg-violet-600',
    peliculas:
        'bg-fuchsia-600/90 text-white border-fuchsia-400/40 shadow-sm shadow-fuchsia-950/20 backdrop-blur-md hover:bg-fuchsia-600',
};

interface CategoryBadgeProps {
    category: string;
    label?: string;
    className?: string;
}

export function getCategoryBadgeStyle(category: string): string {
    return (
        categoryColorMap[category.toLowerCase()] ??
        'bg-neutral-800/90 text-white border-neutral-600/50 shadow-sm backdrop-blur-md hover:bg-neutral-800'
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
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase transition-colors ${style} ${className}`}
        >
            {label ?? category}
        </span>
    );
}
