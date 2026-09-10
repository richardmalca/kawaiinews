import { NewsArticle } from './admin';

export type PublicArticle = NewsArticle;

export type PublicCategorySummary = {
    label: string;
    count: number;
};

export type PublicTag = {
    id: number;
    name: string;
    slug: string;
    articles_count?: number;
};

export type PublicPaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type PublicPaginatedArticles = {
    data: PublicArticle[];
    meta?: {
        current_page: number;
        last_page: number;
        total: number;
        links?: PublicPaginationLink[];
    };
    links?: {
        prev: string | null;
        next: string | null;
    };
};

export type PublicUserProfile = {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    google_avatar?: string | null;
    custom_avatar?: string | null;
    banner?: string | null;
    avatar_source?: 'google' | 'custom';
    is_author: boolean;
    published_articles_count: number | null;
    followers_count: number;
    following_count: number;
    is_following: boolean;
    is_self: boolean;
    shares_visible: boolean;
    shares: {
        id: number;
        title: string;
        slug: string;
        category?: string;
        excerpt?: string | null;
        featured_image: string | null;
        shared_at?: string;
        shared_date?: string;
    }[];
    favorites?: {
        id: number;
        title: string;
        slug: string;
        category?: string;
        excerpt?: string | null;
        featured_image: string | null;
    }[];
};
