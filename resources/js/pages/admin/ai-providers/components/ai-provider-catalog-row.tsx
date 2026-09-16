import { router } from '@inertiajs/react';
import {
    AudioLines,
    CheckCircle2,
    ChevronDown,
    Image,
    MessageSquareText,
    ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import AddAiProviderDialog from '@/pages/admin/ai-providers/components/add-ai-provider-dialog';
import EditAiProviderDialog from '@/pages/admin/ai-providers/components/edit-ai-provider-dialog';
import {
    activate,
    toggleAutoGenerateFeaturedImage,
    toggleAutoGenerateNarration,
} from '@/routes/admin/ai-providers';
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
    moderation: 'Moderación',
};

const CAPABILITY_ICONS: Record<AiProviderCapability, typeof MessageSquareText> =
    {
        text: MessageSquareText,
        image: Image,
        audio: AudioLines,
        moderation: ShieldCheck,
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
        {
            // La moderación de comentarios con IA reutiliza un modelo de
            // texto (clasifica "OK"/"BLOQUEAR"), no es una capacidad nueva
            // del catálogo — por eso depende de supports_text igual que
            // "text".
            key: 'moderation',
            supported: entry.supports_text,
            active: provider?.is_active_for_moderation ?? false,
        },
    ];

    const activatable = capabilities.filter(
        ({ supported, active }) => supported && !active,
    );
    const active = capabilities.filter(({ active }) => active);

    const handleActivate = (capability: AiProviderCapability) => {
        if (!provider) {
            return;
        }

        router.post(activate(provider.id).url, { capability });
    };

    const handleToggleAutoGenerateImage = (enabled: boolean) => {
        if (!provider) {
            return;
        }

        router.post(
            toggleAutoGenerateFeaturedImage(provider.id).url,
            { enabled },
            { preserveScroll: true },
        );
    };

    const handleToggleAutoGenerateNarration = (enabled: boolean) => {
        if (!provider) {
            return;
        }

        router.post(
            toggleAutoGenerateNarration(provider.id).url,
            { enabled },
            { preserveScroll: true },
        );
    };

    return (
        <Card>
            <CardContent className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="font-medium">{entry.label}</p>
                        <p className="text-muted-foreground text-xs">
                            {entry.provider}
                        </p>
                    </div>

                    {provider ? (
                        <EditAiProviderDialog provider={provider} />
                    ) : (
                        <AddAiProviderDialog entry={entry} />
                    )}
                </div>

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

                {entry.models.length > 0 && (
                    <p
                        className="text-muted-foreground truncate text-xs"
                        title={entry.models.join(', ')}
                    >
                        {entry.models.join(', ')}
                    </p>
                )}

                {provider && (active.length > 0 || activatable.length > 0) && (
                    <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
                        {active.map(({ key }) => (
                            <Badge
                                key={key}
                                className="gap-1"
                                title={`${CAPABILITY_LABELS[key]}: activado`}
                            >
                                <CheckCircle2 className="h-3 w-3" />
                                {CAPABILITY_LABELS[key]}
                            </Badge>
                        ))}

                        {activatable.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                    >
                                        Activar para
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    {activatable.map(({ key }) => (
                                        <DropdownMenuItem
                                            key={key}
                                            onSelect={() =>
                                                handleActivate(key)
                                            }
                                        >
                                            {CAPABILITY_LABELS[key]}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                )}

                {provider?.is_active_for_images && (
                    <label
                        className="flex items-center gap-2 text-xs"
                        title="Al crear un artículo, genera sola la imagen de portada con IA usando la imagen de la fuente como referencia. Gasta créditos por cada artículo nuevo con imagen de fuente."
                    >
                        <Switch
                            checked={provider.auto_generate_featured_image}
                            onCheckedChange={handleToggleAutoGenerateImage}
                        />
                        <span className="text-muted-foreground">
                            Portada automática al crear
                        </span>
                    </label>
                )}

                {provider?.is_active_for_audio && (
                    <label
                        className="flex items-center gap-2 text-xs"
                        title="Al crear un artículo, genera sola la narración de audio con este proveedor. Gasta créditos por cada artículo nuevo."
                    >
                        <Switch
                            checked={provider.auto_generate_narration}
                            onCheckedChange={handleToggleAutoGenerateNarration}
                        />
                        <span className="text-muted-foreground">
                            Audio automático al crear
                        </span>
                    </label>
                )}

                {!provider && (
                    <p className="text-muted-foreground text-xs">
                        Sin configurar
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
