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
