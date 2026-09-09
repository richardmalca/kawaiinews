import { Head } from '@inertiajs/react';
import type { PublicArticle, PublicUserProfile } from '@/types';

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
            {article && (
                <>
                    {article.published_at_iso && (
                        <meta property="article:published_time" content={article.published_at_iso} />
                    )}
                    {article.updated_at_iso && (
                        <meta property="article:modified_time" content={article.updated_at_iso} />
                    )}
                    {article.category && (
                        <meta property="article:section" content={article.category} />
                    )}
                    {article.tags?.map((tag) => (
                        <meta key={tag} property="article:tag" content={tag} />
                    ))}
                </>
            )}

            {/* Twitter Cards */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@KawaiiNews" />
            <meta name="twitter:title" content={computedTitle} />
            <meta name="twitter:description" content={computedDescription} />
            {computedImage && <meta name="twitter:image" content={computedImage} />}

            {/* Structured Data (Schema.org JSON-LD) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
        </Head>
    );
}
