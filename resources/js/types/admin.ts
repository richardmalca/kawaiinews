export type AdminUser = {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    role: string | null;
    email_verified_at: string | null;
    created_at: string;
};

export type AiProvider = {
    id: number;
    provider: string;
    label: string;
    default_model: string;
    has_api_key: boolean;
    is_active: boolean;
    last_verified_at: string | null;
};

export type AiProviderSummary = {
    total: number;
    configured: number;
    models: string[];
    active: {
        label: string;
        provider: string;
        model: string;
    } | null;
};

export type AiProviderCatalogEntry = {
    provider: string;
    label: string;
    models: string[];
    configured: boolean;
    provider_id: number | null;
};

export type NewsSource = {
    id: number;
    source_key: string;
    category: string;
    label: string;
    url: string;
    rss_url: string | null;
    is_active: boolean;
    last_scraped_at: string | null;
};

export type NewsSourceGroup = {
    category: string;
    label: string;
    sources: NewsSource[];
};

export type NewsSourceSummary = {
    total_active: number;
    total_sources: number;
    categories_active: number;
};

export type NewsClusterSourceItem = {
    id: number;
    title: string;
    url: string;
    source_label: string;
};

export type NewsCluster = {
    id: number;
    title: string;
    category: string;
    summary: string | null;
    image_url: string | null;
    sources_count: number;
    relevance_score: number;
    status: 'pending' | 'accepted' | 'rejected';
    article_id: number | null;
    first_seen_at: string | null;
    sources: NewsClusterSourceItem[];
};

export type NewsArticle = {
    id: number;
    title: string;
    slug: string;
    category: string;
    excerpt: string | null;
    body: string | null;
    featured_image: string | null;
    status: 'draft' | 'published';
    published_at: string | null;
    created_at: string | null;
    tags: string[];
};

export type NewsCategoryCatalog = Record<string, { label: string }>;

export type MediaItem = {
    id: number;
    url: string;
    original_name: string | null;
    source: 'upload' | 'url';
};
