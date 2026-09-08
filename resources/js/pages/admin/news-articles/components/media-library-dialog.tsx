import { ImagePlus, Link2, Upload } from 'lucide-react';
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
};

export default function MediaLibraryDialog({ onSelect, trigger }: Props) {
    const [open, setOpen] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { items, loading, uploading, loadItems, uploadFile, addFromUrl } =
        useMediaLibrary();

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (nextOpen) {
            loadItems();
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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Biblioteca de medios</DialogTitle>
                    <DialogDescription>
                        Elegí una imagen ya subida, subí una nueva o agregala
                        desde una URL
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
                </div>

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
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handlePick(item.url)}
                                    className={cn(
                                        'group border-input relative aspect-square overflow-hidden border',
                                        'hover:ring-primary hover:ring-2',
                                    )}
                                >
                                    <img
                                        src={item.url}
                                        alt={item.original_name ?? ''}
                                        className="h-full w-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
