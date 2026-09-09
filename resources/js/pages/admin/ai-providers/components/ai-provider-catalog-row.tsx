import { router } from '@inertiajs/react';
import {
    AudioLines,
    CheckCircle2,
    Image,
    MessageSquareText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import AddAiProviderDialog from '@/pages/admin/ai-providers/components/add-ai-provider-dialog';
import EditAiProviderDialog from '@/pages/admin/ai-providers/components/edit-ai-provider-dialog';
import { activate } from '@/routes/admin/ai-providers';
import type {
    AiProvider,
    AiProviderCapability,
    AiProviderCatalogEntry,
} from '@/types/admin';

type Props = {
    entry: AiProviderCatalogEntry;
    provider: AiProvider | null;
};

const CAPABILITY_LABELS: Record<AiProviderCapability, string> = {
    text: 'Texto',
    image: 'Imágenes',
    audio: 'Audio',
};

const CAPABILITY_ICONS: Record<AiProviderCapability, typeof MessageSquareText> =
    {
        text: MessageSquareText,
        image: Image,
        audio: AudioLines,
    };

export default function AiProviderCatalogRow({ entry, provider }: Props) {
    const capabilities: {
        key: AiProviderCapability;
        supported: boolean;
        active: boolean;
    }[] = [
        {
            key: 'text',
            supported: entry.supports_text,
            active: provider?.is_active ?? false,
        },
        {
            key: 'image',
            supported: entry.supports_image,
            active: provider?.is_active_for_images ?? false,
        },
        {
            key: 'audio',
            supported: entry.supports_audio,
            active: provider?.is_active_for_audio ?? false,
        },
    ];

    const handleActivate = (capability: AiProviderCapability) => {
        if (!provider) {
            return;
        }

        router.post(activate(provider.id).url, { capability });
    };

    return (
        <TableRow>
            <TableCell className="py-2">
                <p className="font-medium">{entry.label}</p>
                <p className="text-muted-foreground text-xs">
                    {entry.provider}
                </p>
            </TableCell>

            <TableCell className="py-2">
                <div className="flex flex-wrap gap-1">
                    {capabilities.map(({ key, supported }) => {
                        const Icon = CAPABILITY_ICONS[key];

                        return (
                            <Badge
                                key={key}
                                variant={supported ? 'outline' : 'secondary'}
                                className={cn(
                                    'gap-1',
                                    !supported &&
                                        'text-muted-foreground/50 line-through',
                                )}
                                title={CAPABILITY_LABELS[key]}
                            >
                                <Icon className="h-3 w-3" />
                                {CAPABILITY_LABELS[key]}
                            </Badge>
                        );
                    })}
                </div>
            </TableCell>

            <TableCell className="max-w-56 py-2">
                <p
                    className="text-muted-foreground truncate text-xs"
                    title={entry.models.join(', ')}
                >
                    {entry.models.join(', ')}
                </p>
            </TableCell>

            <TableCell className="py-2">
                {provider ? (
                    <div className="flex flex-wrap gap-1.5">
                        {capabilities.map(
                            ({ key, supported, active }) =>
                                supported &&
                                (active ? (
                                    <Badge
                                        key={key}
                                        className="gap-1"
                                        title={`${CAPABILITY_LABELS[key]}: activado`}
                                    >
                                        <CheckCircle2 className="h-3 w-3" />
                                        {CAPABILITY_LABELS[key]}
                                    </Badge>
                                ) : (
                                    <Button
                                        key={key}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleActivate(key)}
                                    >
                                        Activar {CAPABILITY_LABELS[key]}
                                    </Button>
                                )),
                        )}
                    </div>
                ) : (
                    <span className="text-muted-foreground text-xs">
                        Sin configurar
                    </span>
                )}
            </TableCell>

            <TableCell className="py-2 text-right">
                {provider ? (
                    <EditAiProviderDialog provider={provider} />
                ) : (
                    <AddAiProviderDialog entry={entry} />
                )}
            </TableCell>
        </TableRow>
    );
}
