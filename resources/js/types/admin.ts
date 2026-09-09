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
    is_active_for_images: boolean;
    is_active_for_audio: boolean;
    supports_image: boolean;
    supports_audio: boolean;
    last_verified_at: string | null;
};

export type AiProviderCapability = 'text' | 'image' | 'audio';

export type AiProviderSummary = {
    total: number;
    configured: number;
    models: string[];
    active: {
        label: string;
        provider: string;
        model: string;
    } | null;
    active_image: {
        label: string;
        provider: string;
    } | null;
    active_audio: {
        label: string;
        provider: string;
    } | null;
};

export type AiProviderCatalogEntry = {
    provider: string;
    label: string;
    models: string[];
    configured: boolean;
    provider_id: number | null;
    supports_text: boolean;
    supports_image: boolean;
    supports_audio: boolean;
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
    ai_verdict: 'publish' | 'discard' | null;
    ai_reason: string | null;
    article_id: number | null;
    first_seen_at: string | null;
    published_at: string | null;
    sources: NewsClusterSourceItem[];
};

export type NewsReviewSort = 'relevance' | 'newest' | 'oldest';

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
    published_at_formatted?: string | null;
    published_at_time?: string | null;
    created_at: string | null;
    audio_url?: string | null;
    tags: string[];
};

export type NewsCategoryCatalog = Record<string, { label: string }>;

export type MediaItem = {
    id: number;
    url: string;
    original_name: string | null;
    source: 'upload' | 'url' | 'ai';
    provider: string | null;
    model: string | null;
    type: 'image' | 'audio';
    news_article_id: number | null;
    article_title?: string | null;
    created_at?: string | null;
    created_at_formatted?: string | null;
};
