import { useMemo } from 'react';
import type { AiProviderSummary } from '@/types/admin';

export function useAiProviderSummary(summary: AiProviderSummary) {
    const modelsLabel = useMemo(
        () =>
            summary.models.length > 0
                ? summary.models.join(', ')
                : 'Ningún modelo configurado',
        [summary.models],
    );

    return { modelsLabel };
}
