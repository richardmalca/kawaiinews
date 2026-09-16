import {
    AudioLines,
    Image,
    MessageSquareText,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AiProviderSummary } from '@/types/admin';

type Props = {
    summary: AiProviderSummary;
};

function ActiveCard({
    icon: Icon,
    label,
    active,
    autoGenerateLabel,
}: {
    icon: LucideIcon;
    label: string;
    active: { label: string; model?: string | null } | null;
    autoGenerateLabel?: string;
}) {
    return (
        <Card className="h-full">
            <CardContent className="flex h-full items-start gap-3">
                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center">
                    <Icon className="text-muted-foreground h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">{label}</p>
                    {active ? (
                        <>
                            <p className="truncate text-sm font-semibold">
                                {active.label}
                            </p>
                            {active.model && (
                                <p className="text-muted-foreground truncate text-xs">
                                    {active.model}
                                </p>
                            )}
                            {autoGenerateLabel && (
                                <Badge
                                    variant="outline"
                                    className="mt-1 h-auto gap-1 py-1 text-left whitespace-normal"
                                >
                                    <Sparkles className="h-3 w-3 shrink-0" />
                                    {autoGenerateLabel}
                                </Badge>
                            )}
                        </>
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            Ninguno activado
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function AiProviderActiveOverview({ summary }: Props) {
    return (
        <div className="space-y-2">
            <h2 className="text-sm font-medium">Qué está activo ahora</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <ActiveCard
                    icon={MessageSquareText}
                    label="Texto (redacción)"
                    active={summary.active}
                />
                <ActiveCard
                    icon={Image}
                    label="Imágenes"
                    active={summary.active_image}
                    autoGenerateLabel={
                        summary.active_image?.auto_generate
                            ? 'Portada automática'
                            : undefined
                    }
                />
                <ActiveCard
                    icon={AudioLines}
                    label="Audio (narración)"
                    active={summary.active_audio}
                    autoGenerateLabel={
                        summary.active_audio?.auto_generate
                            ? 'Audio automático'
                            : undefined
                    }
                />
                <ActiveCard
                    icon={ShieldCheck}
                    label="Moderación IA (pago)"
                    active={summary.active_moderation}
                />
                <ActiveCard
                    icon={ShieldCheck}
                    label="Moderación gratis"
                    active={
                        summary.free_moderation.configured
                            ? { label: 'Google Cloud Natural Language' }
                            : null
                    }
                />
            </div>
        </div>
    );
}
