import type { NewsSourceSummary } from '@/types/admin';

export function useNewsSourceSummary(summary: NewsSourceSummary) {
    const activeLabel = `${summary.total_active} / ${summary.total_sources}`;

    return { activeLabel };
}
