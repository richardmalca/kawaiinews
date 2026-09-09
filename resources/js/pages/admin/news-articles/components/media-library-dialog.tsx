import { ImagePlus, Link2, Sparkles, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useMediaLibrary } from '@/pages/admin/news-articles/hooks/use-media-library';
import { cn } from '@/lib/utils';

type Props = {
    onSelect: (url: string) => void;
    trigger: React.ReactNode;
    aiPrompt?: string | null;
};

export default function MediaLibraryDialog({
    onSelect,
    trigger,
    aiPrompt = null,
}: Props) {
    const [open, setOpen] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        items,
        loading,
        uploading,
        loadItems,
        uploadFile,
        addFromUrl,
        generateWithAi,
        deleteItem,
    } = useMediaLibrary();

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (nextOpen) {
            void loadItems();
        }
    };

    const handlePick = (url: string) => {
        onSelect(url);
        setOpen(false);
    };

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const media = await uploadFile(file);

        if (media) {
            handlePick(media.url);
        }

        event.target.value = '';
    };

    const handleAddUrl = async () => {
        if (!urlInput.trim()) {
            return;
        }

        const media = await addFromUrl(urlInput.trim());

        if (media) {
            setUrlInput('');
            handlePick(media.url);
        }
    };

    const handleDelete = async (
        event: React.MouseEvent<HTMLButtonElement>,
        item: (typeof items)[number],
    ) => {
        event.stopPropagation();

        if (!window.confirm('¿Eliminar esta imagen de la biblioteca?')) {
            return;
        }

        await deleteItem(item);
    };

    const handleGenerate = async () => {
        if (!aiPrompt) {
            return;
        }

        const media = await generateWithAi(aiPrompt);

        if (media) {
            handlePick(media.url);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Biblioteca de medios</DialogTitle>
                    <DialogDescription>
                        Elegí una imagen ya subida, subí una nueva, agregala
                        desde una URL o generala con IA a partir de la noticia
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {uploading ? <Spinner /> : <Upload />}
                        Subir archivo
                    </Button>

                    <div className="flex flex-1 gap-2">
                        <Input
                            placeholder="https://..."
                            value={urlInput}
                            onChange={(event) =>
                                setUrlInput(event.target.value)
                            }
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploading || !urlInput.trim()}
                            onClick={handleAddUrl}
                        >
                            <Link2 />
                            Agregar
                        </Button>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading || !aiPrompt}
                        title={
                            aiPrompt
                                ? undefined
                                : 'Completá título, resumen y contenido para generar una imagen con IA'
                        }
                        onClick={handleGenerate}
                    >
                        {uploading ? <Spinner /> : <Sparkles />}
                        Generar con IA a partir de la noticia
                    </Button>
                </div>

                {!aiPrompt && (
                    <p className="text-muted-foreground text-xs">
                        Completá título, resumen y contenido de la noticia para
                        poder generar una imagen con IA basada en ese texto.
                    </p>
                )}

                <div className="max-h-[32rem] overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center py-10">
                            <Spinner />
                        </div>
                    )}

                    {!loading && items.length === 0 && (
                        <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-sm">
                            <ImagePlus className="h-8 w-8" />
                            Todavía no hay imágenes en la biblioteca
                        </div>
                    )}

                    {!loading && items.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="group relative aspect-square"
                                >
                                    <button
                                        type="button"
                                        onClick={() => handlePick(item.url)}
                                        className={cn(
                                            'border-input relative h-full w-full overflow-hidden border',
                                            'hover:ring-primary hover:ring-2',
                                        )}
                                    >
                                        <img
                                            src={item.url}
                                            alt={item.original_name ?? ''}
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(event) =>
                                            handleDelete(event, item)
                                        }
                                        className="bg-destructive text-destructive-foreground absolute top-1 right-1 hidden h-6 w-6 items-center justify-center opacity-90 group-hover:flex"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span className="sr-only">
                                            Eliminar
                                        </span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
