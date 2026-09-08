import { usePage } from '@inertiajs/react';
import { Pencil, PlugZap } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import DeleteAiProviderDialog from '@/pages/admin/ai-providers/components/delete-ai-provider-dialog';
import { useSaveAiProvider } from '@/pages/admin/ai-providers/hooks/use-save-ai-provider';
import { useTestAiConnection } from '@/pages/admin/ai-providers/hooks/use-test-ai-connection';
import type { AiProvider } from '@/types/admin';

type Props = {
    provider: AiProvider;
};

export default function EditAiProviderDialog({ provider }: Props) {
    const { errors } = usePage().props;
    const [open, setOpen] = useState(false);

    const { saveProvider, processing } = useSaveAiProvider(() =>
        setOpen(false),
    );
    const { testConnection, processing: testing } = useTestAiConnection();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        saveProvider(provider.id, {
            label: formData.get('label') as string,
            default_model: formData.get('default_model') as string,
            api_key: formData.get('api_key') as string,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    <Pencil />
                    Editar
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar {provider.label}</DialogTitle>
                    <DialogDescription>
                        Actualiza los datos o la API key de este proveedor
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    id={`edit-provider-form-${provider.id}`}
                >
                    <div className="grid gap-2">
                        <Label htmlFor={`label-${provider.id}`}>Nombre</Label>
                        <Input
                            id={`label-${provider.id}`}
                            name="label"
                            required
                            defaultValue={provider.label}
                        />
                        <InputError message={errors.label} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`model-${provider.id}`}>
                            Modelo por defecto
                        </Label>
                        <Input
                            id={`model-${provider.id}`}
                            name="default_model"
                            required
                            defaultValue={provider.default_model}
                        />
                        <InputError message={errors.default_model} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`api-key-${provider.id}`}>
                            API key
                        </Label>
                        <Input
                            id={`api-key-${provider.id}`}
                            name="api_key"
                            type="password"
                            autoComplete="off"
                            placeholder={
                                provider.has_api_key
                                    ? '••••••••••••••••'
                                    : 'sk-ant-...'
                            }
                        />
                        <p className="text-muted-foreground text-xs">
                            {provider.has_api_key
                                ? 'Ya hay una API key guardada. Déjalo en blanco para conservarla.'
                                : 'Aún no has agregado una API key.'}
                        </p>
                        <InputError message={errors.api_key} />
                    </div>

                    {provider.last_verified_at && (
                        <p className="text-muted-foreground text-xs">
                            Última verificación: {provider.last_verified_at}
                        </p>
                    )}
                </form>

                <DialogFooter className="flex-wrap gap-2 sm:justify-between">
                    <div className="flex items-center gap-2">
                        <DeleteAiProviderDialog provider={provider} />
                        <Button
                            type="button"
                            variant="outline"
                            disabled={testing || !provider.has_api_key}
                            onClick={() => testConnection(provider.id)}
                        >
                            {testing ? <Spinner /> : <PlugZap />}
                            Probar conexión
                        </Button>
                    </div>

                    <Button
                        type="submit"
                        form={`edit-provider-form-${provider.id}`}
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
