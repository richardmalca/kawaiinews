import { Head, usePage } from '@inertiajs/react';
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
    const { name: sharedName, siteSeoTitle, siteDescription, siteOgImageUrl, siteLogoUrl, siteUrl, currentUrl, searchBoxEnabled } = usePage().props;
    const siteName = sharedName || 'KawaiiNews';
    const defaultDescription =
        siteDescription ||
        'Tu portal definitivo de noticias de anime, manga, videojuegos y cultura otaku al instante.';
    const defaultImage =
        siteOgImageUrl ||
        (typeof window !== 'undefined'
            ? `${window.location.origin}/og-default.png`
            : '/og-default.png');
    const publisherLogo =
        siteLogoUrl ||
        defaultImage;

    const computedTitle = article
        ? `${article.title} - ${siteName}`
        : profile
          ? `@${profile.username} (${profile.name}) - ${siteName}`
          : title
            ? title.includes(siteName)
                ? title
                : `${title} - ${siteName}`
            : siteSeoTitle || `${siteName} - Noticias de Anime, Manga y Gaming`;

    const computedDescription =
        article?.excerpt ||
        description ||
        defaultDescription;

    const computedUrl =
        canonicalUrl ||
        article?.canonical_url ||
        currentUrl ||
        (typeof window !== 'undefined' ? window.location.href : '');

    const computedImage =
        article?.featured_image ||
        profile?.avatar ||
        ogImage ||
        defaultImage;

    const imageExtension = computedImage.split('?')[0].split('.').pop()?.toLowerCase();
    const computedImageType =
        imageExtension === 'webp'
            ? 'image/webp'
            : imageExtension === 'jpg' || imageExtension === 'jpeg'
              ? 'image/jpeg'
              : imageExtension === 'gif'
                ? 'image/gif'
                : 'image/png';

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
                            ? `${siteUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/perfil/${article.author.username}`
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
                      url: publisherLogo,
                  },
              },
              articleSection: article.category,
              keywords: article.tags?.join(', ') || article.category,
          }
        : {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: siteName,
              url: siteUrl || (typeof window !== 'undefined' ? window.location.origin : ''),
              description: defaultDescription,
              ...(searchBoxEnabled
                  ? {
                        potentialAction: {
                            '@type': 'SearchAction',
                            target: `${siteUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/?q={search_term_string}`,
                            'query-input': 'required name=search_term_string',
                        },
                    }
                  : {}),
          };

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

            <script
                id="kawaii-structured-data"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Open Graph */}
            <meta property="og:site_name" content={siteName} />
            <meta property="og:type" content={computedType} />
            <meta property="og:title" content={computedTitle} />
            <meta property="og:description" content={computedDescription} />
            {computedUrl && <meta property="og:url" content={computedUrl} />}
            {computedImage && (
                <>
                    <meta property="og:image" content={computedImage} />
                    <meta property="og:image:secure_url" content={computedImage} />
                    <meta property="og:image:type" content={computedImageType} />
                    <meta property="og:image:alt" content={computedTitle} />
                    <meta property="og:image:width" content="1200" />
                    <meta property="og:image:height" content="630" />
                </>
            )}
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
            {computedImage && (
                <>
                    <meta name="twitter:image" content={computedImage} />
                    <meta name="twitter:image:alt" content={computedTitle} />
                </>
            )}
        </Head>
    );
}
