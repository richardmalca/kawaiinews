import { NewsArticle } from './admin';

export type PublicArticle = NewsArticle;

export type PublicCategorySummary = {
    label: string;
    count: number;
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
