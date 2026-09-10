import { ImagePlus, Link2, Sparkles, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import DeleteMediaButton from '@/components/delete-media-button';
import { Badge } from '@/components/ui/badge';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useElapsedSeconds } from '@/hooks/use-elapsed-seconds';
import { cn } from '@/lib/utils';
import { useMediaLibrary } from '@/pages/admin/news-articles/hooks/use-media-library';
import type { MediaItem } from '@/types/admin';

/**
 * Estado de generación compartido con el padre (edit.tsx) en vez de que
 * cada instancia del diálogo tenga el suyo propio — así arrancar una
 * generación acá adentro y cerrar el diálogo a mitad de camino no pierde
 * el feedback ni el bloqueo contra generar dos veces (ver
 * ArticleImageGenerationStatus, que muestra este mismo estado afuera del
 * diálogo). Opcional: sin esto, el diálogo funciona con su propio estado
 * local (create.tsx no ofrece generación con IA, así que no lo necesita).
 */
type SharedGeneration = {
    generating: boolean;
    generationStartedAt: number | null;
    generateWithAi: (
        prompt: string,
        newsArticleId: number | null,
    ) => Promise<MediaItem | null>;
};

type Props = {
    onSelect: (url: string) => void;
    trigger: React.ReactNode;
    aiPrompt?: string | null;
    newsArticleId?: number | null;
    generation?: SharedGeneration;
};

export default function MediaLibraryDialog({
    onSelect,
    trigger,
    aiPrompt = null,
    newsArticleId = null,
    generation,
}: Props) {
    const [open, setOpen] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        items,
        loading,
        uploading,
        generating: localGenerating,
        generationStartedAt: localGenerationStartedAt,
        loadItems,
        uploadFile,
        addFromUrl,
        generateWithAi: localGenerateWithAi,
        deleteItem,
    } = useMediaLibrary();

    const generating = generation?.generating ?? localGenerating;
    const generationStartedAt =
        generation?.generationStartedAt ?? localGenerationStartedAt;
    const generateWithAi = generation?.generateWithAi ?? localGenerateWithAi;
    const generationElapsed = useElapsedSeconds(generationStartedAt);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (nextOpen) {
            void loadItems();
        }
    };

    const handlePick = (item: (typeof items)[number]) => {
        if (isUsedElsewhere(item)) {
            return;
        }

        onSelect(item.url);
        setOpen(false);
    };

    const isUsedElsewhere = (item: (typeof items)[number]) =>
        item.news_article_id !== null && item.news_article_id !== newsArticleId;

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const media = await uploadFile(file, newsArticleId);

        if (media) {
            handlePick(media);
        }

        event.target.value = '';
    };

    const handleAddUrl = async () => {
        if (!urlInput.trim()) {
            return;
        }

        const media = await addFromUrl(urlInput.trim(), newsArticleId);

        if (media) {
            setUrlInput('');
            handlePick(media);
        }
    };

    const handleGenerate = async () => {
        if (!aiPrompt) {
            return;
        }

        const media = await generateWithAi(aiPrompt, newsArticleId);

        if (media) {
            handlePick(media);
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
                        disabled={uploading || generating || !aiPrompt}
                        title={
                            aiPrompt
                                ? undefined
                                : 'Completá título, resumen y contenido para generar una imagen con IA'
                        }
                        onClick={handleGenerate}
                    >
                        {generating ? <Spinner /> : <Sparkles />}
                        {generating
                            ? `Generando... (${generationElapsed}s, puede tardar hasta 2 min)`
                            : 'Generar con IA a partir de la noticia'}
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">
                                        Imagen
                                    </TableHead>
                                    <TableHead>Modelo</TableHead>
                                    <TableHead>Vinculada a</TableHead>
                                    <TableHead>Fecha y hora</TableHead>
                                    <TableHead className="text-right">
                                        Acciones
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => {
                                    const usedElsewhere = isUsedElsewhere(item);

                                    return (
                                        <TableRow
                                            key={item.id}
                                            className={cn(
                                                usedElsewhere
                                                    ? 'cursor-not-allowed opacity-50'
                                                    : 'cursor-pointer',
                                            )}
                                            onClick={() => handlePick(item)}
                                        >
                                            <TableCell className="py-1.5">
                                                <img
                                                    src={item.url}
                                                    alt={
                                                        item.original_name ?? ''
                                                    }
                                                    className="border-input h-10 w-10 border object-cover"
                                                />
                                            </TableCell>
                                            <TableCell className="py-1.5 text-sm">
                                                {item.provider && item.model ? (
                                                    <span>
                                                        {item.provider} ·{' '}
                                                        {item.model}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground capitalize">
                                                        {item.source ===
                                                        'upload'
                                                            ? 'Subida manual'
                                                            : 'URL externa'}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-1.5 text-sm">
                                                {item.news_article_id ? (
                                                    usedElsewhere ? (
                                                        <Badge variant="secondary">
                                                            Ya usada en:{' '}
                                                            {item.article_title ??
                                                                `noticia #${item.news_article_id}`}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">
                                                            Esta noticia
                                                        </Badge>
                                                    )
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        Libre
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground py-1.5 text-xs">
                                                {item.created_at_formatted}
                                            </TableCell>
                                            <TableCell className="py-1.5 text-right">
                                                <DeleteMediaButton
                                                    itemLabel="esta imagen"
                                                    onConfirm={() =>
                                                        deleteItem(item)
                                                    }
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
