import { Link } from '@inertiajs/react';
import { Newspaper, Sparkles, User as UserIcon } from 'lucide-react';
import { CategoryBadge } from '@/components/public/category-badge';

export interface SearchUserSuggestion {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    is_author: boolean;
}

export interface SearchArticleSuggestion {
    id: number;
    title: string;
    slug: string;
    category: string;
    featured_image: string | null;
}

interface SearchSuggestionsDropdownProps {
    users: SearchUserSuggestion[];
    articles: SearchArticleSuggestion[];
    isLoading: boolean;
    query: string;
    onSelect: () => void;
}

export function SearchSuggestionsDropdown({
    users,
    articles,
    isLoading,
    query,
    onSelect,
}: SearchSuggestionsDropdownProps) {
    const hasUsers = users.length > 0;
    const hasArticles = articles.length > 0;
    const hasResults = hasUsers || hasArticles;

    return (
        <div className="absolute top-full left-0 mt-2 w-72 sm:w-96 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/95 p-2 shadow-2xl backdrop-blur-xl z-50 dark:border-neutral-800/80 dark:bg-neutral-900/95">
            {isLoading && !hasResults ? (
                <div className="p-4 text-center text-xs text-neutral-400">
                    Buscando sugerencias...
                </div>
            ) : !hasResults ? (
                <div className="p-4 text-center text-xs text-neutral-400">
                    No se encontraron resultados para &ldquo;{query}&rdquo;
                </div>
            ) : (
                <div className="space-y-3">
                    {hasUsers && (
                        <div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                <UserIcon className="h-3 w-3 text-rose-500" />
                                <span>Perfiles</span>
                            </div>
                            <div className="space-y-0.5">
                                {users.map((user) => (
                                    <Link
                                        key={user.id}
                                        href={`/perfil/${user.username}`}
                                        onClick={onSelect}
                                        className="group flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-rose-500/10 dark:hover:bg-rose-500/20"
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-rose-500/10 text-xs font-bold text-rose-600 dark:border-neutral-700 dark:bg-rose-500/20 dark:text-rose-400">
                                            {user.avatar ? (
                                                <img
                                                    src={user.avatar}
                                                    alt={user.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                user.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <p className="truncate text-xs font-semibold text-neutral-900 group-hover:text-rose-600 dark:text-neutral-100 dark:group-hover:text-rose-400">
                                                    {user.name}
                                                </p>
                                                {user.is_author && (
                                                    <Sparkles className="h-3 w-3 shrink-0 text-rose-500" />
                                                )}
                                            </div>
                                            <p className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500">
                                                @{user.username}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {hasArticles && (
                        <div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                <Newspaper className="h-3 w-3 text-rose-500" />
                                <span>Noticias</span>
                            </div>
                            <div className="space-y-0.5">
                                {articles.map((article) => (
                                    <Link
                                        key={article.id}
                                        href={`/noticias/${article.slug}`}
                                        onClick={onSelect}
                                        className="group flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-rose-500/10 dark:hover:bg-rose-500/20"
                                    >
                                        {article.featured_image ? (
                                            <div className="h-9 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                                                <img
                                                    src={article.featured_image}
                                                    alt={article.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                                                <Newspaper className="h-4 w-4" />
                                            </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-1 text-xs font-medium text-neutral-900 group-hover:text-rose-600 dark:text-neutral-100 dark:group-hover:text-rose-400">
                                                {article.title}
                                            </p>
                                            <div className="mt-0.5">
                                                <CategoryBadge
                                                    category={article.category}
                                                    className="text-[9px] px-1.5 py-0"
                                                />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
