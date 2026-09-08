import { router } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import AddAiProviderDialog from '@/pages/admin/ai-providers/components/add-ai-provider-dialog';
import EditAiProviderDialog from '@/pages/admin/ai-providers/components/edit-ai-provider-dialog';
import { activate } from '@/routes/admin/ai-providers';
import type { AiProvider, AiProviderCatalogEntry } from '@/types/admin';

type Props = {
    entry: AiProviderCatalogEntry;
    provider: AiProvider | null;
};

export default function AiProviderCatalogCard({ entry, provider }: Props) {
    const isActive = provider?.is_active ?? false;

    return (
        <Card className={cn(isActive && 'ring-2 ring-primary')}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                    {entry.label}
                    {entry.configured && (
                        <Badge variant={isActive ? 'default' : 'secondary'}>
                            {isActive && <CheckCircle2 className="h-3 w-3" />}
                            {isActive ? 'Activo' : 'Configurado'}
                        </Badge>
                    )}
                </CardTitle>
                <CardDescription>{entry.provider}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                    {entry.models.map((model) => (
                        <Badge key={model} variant="outline">
                            {model}
                        </Badge>
                    ))}
                </div>

                {!provider && <AddAiProviderDialog entry={entry} />}

                {provider && (
                    <div className="flex flex-wrap gap-2">
                        <EditAiProviderDialog provider={provider} />

                        {!isActive && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    router.post(activate(provider.id).url)
                                }
                            >
                                Usar como activo
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
