import { usePage } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
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
import { useSaveNewsSource } from '@/pages/admin/news-sources/hooks/use-save-news-source';
import type { NewsSource } from '@/types/admin';

type Props = {
    source: NewsSource;
};

export default function EditNewsSourceDialog({ source }: Props) {
    const { errors } = usePage().props;
    const [open, setOpen] = useState(false);

    const { saveSource, processing } = useSaveNewsSource(() =>
        setOpen(false),
    );

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        saveSource(source.id, {
            label: formData.get('label') as string,
            url: formData.get('url') as string,
            rss_url: formData.get('rss_url') as string,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar {source.label}</DialogTitle>
                    <DialogDescription>
                        Actualiza la URL o el feed RSS de esta fuente
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    id={`edit-source-form-${source.id}`}
                >
                    <div className="grid gap-2">
                        <Label htmlFor={`label-${source.id}`}>Nombre</Label>
                        <Input
                            id={`label-${source.id}`}
                            name="label"
                            required
                            defaultValue={source.label}
                        />
                        <InputError message={errors.label} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`url-${source.id}`}>Sitio web</Label>
                        <Input
                            id={`url-${source.id}`}
                            name="url"
                            type="url"
                            required
                            defaultValue={source.url}
                        />
                        <InputError message={errors.url} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`rss-${source.id}`}>
                            Feed RSS (opcional)
                        </Label>
                        <Input
                            id={`rss-${source.id}`}
                            name="rss_url"
                            type="url"
                            defaultValue={source.rss_url ?? ''}
                        />
                        <InputError message={errors.rss_url} />
                    </div>
                </form>

                <DialogFooter>
                    <Button
                        type="submit"
                        form={`edit-source-form-${source.id}`}
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
