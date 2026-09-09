import { CategoryBadge } from '@/components/public/category-badge';
import type { PublicArticle } from '@/types';

interface ArticleHeaderProps {
    article: PublicArticle;
}

export function ArticleHeader({ article }: ArticleHeaderProps) {
    return (
        <header className="space-y-4">
            <div>
                <CategoryBadge category={article.category} />
            </div>

            <h1
                id="article-title"
                className="text-2xl leading-tight font-black tracking-tight text-neutral-950 transition-colors duration-300 sm:text-3xl lg:text-4xl dark:text-white"
            >
                {article.title}
            </h1>

            {article.excerpt && (
                <p
                    id="article-excerpt"
                    className="border-l-2 border-rose-500 pl-4 text-sm leading-relaxed text-neutral-600 transition-colors duration-300 sm:text-base dark:text-neutral-300"
                >
                    {article.excerpt}
                </p>
            )}
        </header>
    );
}
