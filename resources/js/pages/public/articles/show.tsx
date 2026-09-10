import { SeoHead } from '@/components/common/seo-head';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import PublicLayout from '@/layouts/public-layout';
import { formatArticleAsPlainText } from '@/lib/utils';
import { TrendingSidebar } from '@/pages/public/home/components/trending-sidebar';
import type { PublicArticle, PublicCategorySummary } from '@/types';
import { Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Bookmark,
    Check,
    Columns2,
    FileText,
    Heart,
    Maximize2,
    Minus,
    Plus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ArticleActionsPanel } from './components/article-actions-panel';
import { ArticleMobileDock } from './components/article-mobile-dock';
import { ArticleContent } from './components/article-content';
import { ArticleHeader } from './components/article-header';
import { ArticleMetaFooter } from './components/article-meta-footer';
import { ArticleTags } from './components/article-tags';
import { ArticleCommentsSection } from './components/comments/article-comments-section';
import { RelatedArticles } from './components/related-articles';
import { useArticleInteractions } from './hooks/use-article-interactions';
import { LoginDialog } from '@/components/public/login-dialog';

interface ShowArticleProps {
    article: { data: PublicArticle };
    related: { data: PublicArticle[] };
    trending: { data: PublicArticle[] };
    categories: Record<string, PublicCategorySummary>;
}

export default function ShowArticle({
    article,
    related,
    trending,
    categories,
}: ShowArticleProps) {
    const item = article.data;
    const progress = useReadingProgress();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const current = window.scrollY || document.documentElement.scrollTop || 0;
            setIsScrolled(current > 260);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const {
        liked,
        likersCount,
        favorited,
        sharesCount,
        isLiking,
        isFavoriting,
        toggleLike,
        toggleFavorite,
        recordShare,
    } = useArticleInteractions({
        article: item,
        onRequireAuth: () => setIsLoginOpen(true),
    });
    const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
    const [focusMode, setFocusMode] = useState(false);
    const [copiedText, setCopiedText] = useState(false);

    const handleCopyPlainText = async () => {
        try {
            const formatted = formatArticleAsPlainText(item);
            await navigator.clipboard.writeText(formatted);
            setCopiedText(true);
            setTimeout(() => setCopiedText(false), 2000);
        } catch {
            setCopiedText(false);
        }
    };

    return (
        <PublicLayout categories={categories} progress={progress}>
            <SeoHead article={item} />

            <div className="mb-8 flex items-center justify-between">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>
                        <span className="sm:hidden">Volver</span>
                        <span className="hidden sm:inline">Volver a la portada</span>
                    </span>
                </Link>

                <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 rounded-xl border border-neutral-200/80 bg-neutral-100/70 p-1 dark:border-neutral-800/80 dark:bg-neutral-900/60">
                        <button
                            type="button"
                            onClick={() =>
                                setFontSize((curr) =>
                                    curr === 'lg' ? 'base' : 'sm',
                                )
                            }
                            disabled={fontSize === 'sm'}
                            title="Reducir tamaño de letra"
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-white hover:text-neutral-950 disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                        >
                            <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-1 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                            A
                        </span>
                        <button
                            type="button"
                            onClick={() =>
                                setFontSize((curr) =>
                                    curr === 'sm' ? 'base' : 'lg',
                                )
                            }
                            disabled={fontSize === 'lg'}
                            title="Aumentar tamaño de letra"
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-white hover:text-neutral-950 disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                        >
                            <Plus className="h-3 w-3" />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={toggleLike}
                        disabled={isLiking}
                        title={liked ? 'Ya no me gusta' : 'Me gusta'}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                            liked
                                ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:border-rose-400/30 dark:bg-rose-500/20 dark:text-rose-400'
                                : 'border-neutral-200/80 bg-neutral-100/70 text-neutral-600 hover:border-neutral-300 hover:text-neutral-950 dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:text-neutral-400 dark:hover:text-white'
                        }`}
                    >
                        <Heart
                            className={`h-3 w-3 ${liked ? 'fill-rose-500 text-rose-500 dark:fill-rose-400 dark:text-rose-400' : ''}`}
                        />
                        <span>{likersCount > 0 ? likersCount : 'Me gusta'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={toggleFavorite}
                        disabled={isFavoriting}
                        title={favorited ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                            favorited
                                ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-400'
                                : 'border-neutral-200/80 bg-neutral-100/70 text-neutral-600 hover:border-neutral-300 hover:text-neutral-950 dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:text-neutral-400 dark:hover:text-white'
                        }`}
                    >
                        <Bookmark
                            className={`h-3 w-3 ${favorited ? 'fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400' : ''}`}
                        />
                        <span className="hidden sm:inline">
                            {favorited ? 'Guardado' : 'Favorito'}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={handleCopyPlainText}
                        title="Copiar noticia completa a texto plano con pausas para narración"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200/80 bg-neutral-100/70 px-2.5 py-1.5 text-[11px] font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-950 dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:text-neutral-400 dark:hover:text-white"
                    >
                        {copiedText ? (
                            <>
                                <Check className="h-3 w-3 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">
                                    Copiado
                                </span>
                            </>
                        ) : (
                            <>
                                <FileText className="h-3 w-3 text-rose-500" />
                                <span>
                                    <span className="sm:hidden">Copiar</span>
                                    <span className="hidden sm:inline">Copiar texto</span>
                                </span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setFocusMode(!focusMode)}
                        title={
                            focusMode
                                ? 'Mostrar barra lateral'
                                : 'Modo lectura enfocada'
                        }
                        className={`hidden items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium transition-colors lg:inline-flex ${
                            focusMode
                                ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:border-rose-400/30 dark:bg-rose-500/20 dark:text-rose-400'
                                : 'border-neutral-200/80 bg-neutral-100/70 text-neutral-600 hover:border-neutral-300 hover:text-neutral-950 dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:text-neutral-400 dark:hover:text-white'
                        }`}
                    >
                        {focusMode ? (
                            <>
                                <Columns2 className="h-3 w-3" />
                                <span>Diseño estándar</span>
                            </>
                        ) : (
                            <>
                                <Maximize2 className="h-3 w-3" />
                                <span>Lectura enfocada</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div
                className={`grid grid-cols-1 items-start gap-12 transition-all duration-300 ${
                    focusMode ? 'mx-auto max-w-3xl' : 'lg:grid-cols-12'
                }`}
            >
                <article
                    className={`space-y-8 ${focusMode ? 'w-full' : 'lg:col-span-8'}`}
                >
                    <ArticleHeader article={item} />

                    {item.featured_image && (
                        <div className="my-6 flex justify-center">
                            <figure className="inline-block overflow-hidden rounded-2xl border border-neutral-200/60 bg-neutral-100 shadow-xs dark:border-neutral-800/60 dark:bg-neutral-900">
                                <img
                                    src={item.featured_image}
                                    alt={item.title}
                                    className="max-h-[300px] w-auto max-w-full object-contain sm:max-h-[340px]"
                                    loading="eager"
                                />
                            </figure>
                        </div>
                    )}

                    <div className="pt-2">
                        <ArticleContent body={item.body} fontSize={fontSize} />
                    </div>

                    <div className="pt-4">
                        <ArticleTags tags={item.tags} tagItems={item.tag_items} />
                    </div>

                    <ArticleMetaFooter
                        article={item}
                        sharesCount={sharesCount}
                        onShare={recordShare}
                    />

                    <ArticleCommentsSection
                        articleSlug={item.slug}
                        onRequireAuth={() => setIsLoginOpen(true)}
                    />
                </article>

                {!focusMode && (
                    <aside
                        id="tendencias"
                        className="scroll-mt-32 transition-all duration-300 lg:sticky lg:top-32 lg:col-span-4"
                    >
                        <ArticleActionsPanel
                            liked={liked}
                            likersCount={likersCount}
                            favorited={favorited}
                            isLiking={isLiking}
                            isFavoriting={isFavoriting}
                            fontSize={fontSize}
                            copiedText={copiedText}
                            sharesCount={sharesCount}
                            commentsCount={item.comments_count}
                            visible={isScrolled}
                            onToggleLike={toggleLike}
                            onToggleFavorite={toggleFavorite}
                            onCopyPlainText={handleCopyPlainText}
                            setFontSize={setFontSize}
                        />

                        {trending.data.length > 0 && (
                            <TrendingSidebar articles={trending.data} />
                        )}
                    </aside>
                )}
            </div>

            <div className="mt-16">
                <RelatedArticles articles={related.data} />
            </div>

            <ArticleMobileDock
                liked={liked}
                likersCount={likersCount}
                favorited={favorited}
                isLiking={isLiking}
                isFavoriting={isFavoriting}
                fontSize={fontSize}
                copiedText={copiedText}
                commentsCount={item.comments_count}
                onToggleLike={toggleLike}
                onToggleFavorite={toggleFavorite}
                onCopyPlainText={handleCopyPlainText}
                setFontSize={setFontSize}
            />

            <LoginDialog
                open={isLoginOpen}
                onOpenChange={setIsLoginOpen}
                title="Inicia sesión para interactuar"
                description="Únete con tu cuenta de Google para dar me gusta, guardar en favoritos y apoyar a los redactores de KawaiiNews."
            />
        </PublicLayout>
    );
}
