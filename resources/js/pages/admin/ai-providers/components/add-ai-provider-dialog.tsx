import { usePage } from '@inertiajs/react';
import { PlusCircle } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useAddAiProvider } from '@/pages/admin/ai-providers/hooks/use-add-ai-provider';
import type { AiProviderCatalogEntry } from '@/types/admin';

type Props = {
    entry: AiProviderCatalogEntry;
};

export default function AddAiProviderDialog({ entry }: Props) {
    const { errors } = usePage().props;
    const [open, setOpen] = useState(false);
    const [defaultModel, setDefaultModel] = useState(entry.models[0] ?? '');

    const { addProvider, processing } = useAddAiProvider(() => setOpen(false));

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        addProvider({
            provider: entry.provider,
            label: formData.get('label') as string,
            default_model: defaultModel,
            api_key: formData.get('api_key') as string,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                >
                    <PlusCircle />
                    Agregar proveedor
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Agregar {entry.label}</DialogTitle>
                    <DialogDescription>
                        Configura el modelo por defecto y, si quieres, la API
                        key de una vez
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    id={`add-provider-form-${entry.provider}`}
                >
                    <div className="grid gap-2">
                        <Label htmlFor={`label-${entry.provider}`}>
                            Nombre
                        </Label>
                        <Input
                            id={`label-${entry.provider}`}
                            name="label"
                            required
                            defaultValue={entry.label}
                        />
                        <InputError message={errors.label} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`model-${entry.provider}`}>
                            Modelo por defecto
                        </Label>
                        <Select
                            value={defaultModel}
                            onValueChange={setDefaultModel}
                        >
                            <SelectTrigger
                                id={`model-${entry.provider}`}
                                className="w-full"
                            >
                                <SelectValue placeholder="Selecciona un modelo" />
                            </SelectTrigger>
                            <SelectContent>
                                {entry.models.map((model) => (
                                    <SelectItem key={model} value={model}>
                                        {model}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.default_model} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`api-key-${entry.provider}`}>
                            API key (opcional)
                        </Label>
                        <Input
                            id={`api-key-${entry.provider}`}
                            name="api_key"
                            type="password"
                            autoComplete="off"
                            placeholder="Puedes agregarla después"
                        />
                        <InputError message={errors.api_key} />
                    </div>
                </form>

                <DialogFooter>
                    <Button
                        type="submit"
                        form={`add-provider-form-${entry.provider}`}
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        Agregar proveedor
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
