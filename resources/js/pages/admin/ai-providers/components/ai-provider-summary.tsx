import { AudioLines, Bot, Image, KeyRound, Layers } from 'lucide-react';
import AiProviderStat from '@/pages/admin/ai-providers/components/ai-provider-stat';
import { useAiProviderSummary } from '@/pages/admin/ai-providers/hooks/use-ai-provider-summary';
import type { AiProviderSummary as AiProviderSummaryType } from '@/types/admin';

type Props = {
    summary: AiProviderSummaryType;
};

export default function AiProviderSummary({ summary }: Props) {
    const { modelsLabel } = useAiProviderSummary(summary);

    return (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <AiProviderStat
                icon={Layers}
                label="Proveedores instalados"
                value={String(summary.total)}
            />
            <AiProviderStat
                icon={KeyRound}
                label="Con API key configurada"
                value={String(summary.configured)}
            />
            <AiProviderStat icon={Bot} label="Modelos" value={modelsLabel} />
            <AiProviderStat
                icon={Image}
                label="Activo para imágenes"
                value={summary.active_image?.label ?? 'Ninguno'}
            />
            <AiProviderStat
                icon={AudioLines}
                label="Activo para audio"
                value={summary.active_audio?.label ?? 'Ninguno'}
            />
        </div>
    );
}
