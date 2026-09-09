import { Head } from '@inertiajs/react';
import type { PublicArticle, PublicUserProfile } from '@/types';
import { useEffect } from 'react';

interface SeoHeadProps {
    title?: string;
    description?: string;
    canonicalUrl?: string;
    ogImage?: string | null;
    ogType?: 'website' | 'article' | 'profile';
    article?: PublicArticle | null;
    profile?: PublicUserProfile | null;
    noIndex?: boolean;
}

export function SeoHead({
    title,
    description,
    canonicalUrl,
    ogImage,
    ogType = 'website',
    article,
    profile,
    noIndex = false,
}: SeoHeadProps) {
    const siteName = 'KawaiiNews';
    const defaultDescription =
        'Tu portal definitivo de noticias de anime, manga, videojuegos y cultura otaku al instante.';
    const defaultImage =
        typeof window !== 'undefined'
            ? `${window.location.origin}/android-chrome-512x512.png`
            : '/android-chrome-512x512.png';

    const computedTitle = article
        ? `${article.title} - ${siteName}`
        : profile
          ? `@${profile.username} (${profile.name}) - ${siteName}`
          : title
            ? title.includes(siteName)
                ? title
                : `${title} - ${siteName}`
            : `${siteName} - Noticias de Anime, Manga y Gaming`;

    const computedDescription =
        article?.excerpt ||
        description ||
        defaultDescription;

    const computedUrl =
        canonicalUrl ||
        article?.canonical_url ||
        (typeof window !== 'undefined' ? window.location.href : '');

    const computedImage =
        article?.featured_image ||
        profile?.avatar ||
        ogImage ||
        defaultImage;

    const computedType = article ? 'article' : profile ? 'profile' : ogType;

    const jsonLd = article
        ? {
              '@context': 'https://schema.org',
              '@type': 'NewsArticle',
              mainEntityOfPage: {
                  '@type': 'WebPage',
                  '@id': computedUrl,
              },
              headline: article.title,
              description: computedDescription,
              image: computedImage ? [computedImage] : [],
              datePublished: article.published_at_iso || undefined,
              dateModified: article.updated_at_iso || article.published_at_iso || undefined,
              author: article.author
                  ? {
                        '@type': 'Person',
                        name: article.author.name,
                        url: article.author.username
                            ? `${typeof window !== 'undefined' ? window.location.origin : ''}/perfil/${article.author.username}`
                            : undefined,
                    }
                  : {
                        '@type': 'Organization',
                        name: siteName,
                    },
              publisher: {
                  '@type': 'Organization',
                  name: siteName,
                  logo: {
                      '@type': 'ImageObject',
                      url: defaultImage,
                  },
              },
              articleSection: article.category,
              keywords: article.tags?.join(', ') || article.category,
          }
        : {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: siteName,
              url: typeof window !== 'undefined' ? window.location.origin : '',
              description: defaultDescription,
              potentialAction: {
                  '@type': 'SearchAction',
                  target: `${typeof window !== 'undefined' ? window.location.origin : ''}/?q={search_term_string}`,
                  'query-input': 'required name=search_term_string',
              },
          };

    useEffect(() => {
        if (typeof document === 'undefined') {
            return;
        }

        const scriptId = 'kawaii-structured-data';
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.type = 'application/ld+json';
            document.head.appendChild(script);
        }

        script.textContent = JSON.stringify(jsonLd);

        return () => {
            const el = document.getElementById(scriptId);
            if (el) {
                el.remove();
            }
        };
    }, [jsonLd]);

    const tagsList = Array.isArray(article?.tags) ? article.tags : [];

    return (
        <Head>
            <title>{computedTitle}</title>
            <meta name="description" content={computedDescription} />
            {noIndex ? (
                <meta name="robots" content="noindex, nofollow" />
            ) : (
                <meta name="robots" content="index, follow, max-image-preview:large" />
            )}

            {computedUrl && <link rel="canonical" href={computedUrl} />}

            {/* Open Graph */}
            <meta property="og:site_name" content={siteName} />
            <meta property="og:type" content={computedType} />
            <meta property="og:title" content={computedTitle} />
            <meta property="og:description" content={computedDescription} />
            {computedUrl && <meta property="og:url" content={computedUrl} />}
            {computedImage && <meta property="og:image" content={computedImage} />}
            <meta property="og:locale" content="es_LA" />

            {/* Article Specific Open Graph */}
            {article && article.published_at_iso && (
                <meta property="article:published_time" content={article.published_at_iso} />
            )}
            {article && article.updated_at_iso && (
                <meta property="article:modified_time" content={article.updated_at_iso} />
            )}
            {article && article.category && (
                <meta property="article:section" content={article.category} />
            )}
            {article && tagsList.map((tag) => (
                <meta key={tag} property="article:tag" content={tag} />
            ))}

            {/* Twitter Cards */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@KawaiiNews" />
            <meta name="twitter:title" content={computedTitle} />
            <meta name="twitter:description" content={computedDescription} />
            {computedImage && <meta name="twitter:image" content={computedImage} />}
        </Head>
    );
}
