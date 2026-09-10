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
    followers_count?: number;
    is_following?: boolean;
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
    comments?: {
        id: number;
        body: string;
        is_spoiler: boolean;
        created_at?: string;
        created_date?: string;
        article: {
            id: number;
            title: string;
            slug: string;
            category: string;
            featured_image: string | null;
        };
    }[];
};

export type PublicCommentAuthor = {
    id: number;
    name: string;
    username: string;
    avatar?: string | null;
};

export type PublicCommentReplyTo = {
    comment_id: number;
    user_id: number;
    name: string;
    username: string;
};

export type PublicComment = {
    id: number;
    body: string;
    is_spoiler: boolean;
    created_at?: string;
    created_at_iso?: string;
    is_edited: boolean;
    user: PublicCommentAuthor | null;
    reply_to: PublicCommentReplyTo | null;
    likes_count: number;
    has_liked: boolean;
    can_update: boolean;
    can_delete: boolean;
    replies?: PublicComment[];
};

export type PublicCommentsResponse = {
    data: PublicComment[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
    };
};
