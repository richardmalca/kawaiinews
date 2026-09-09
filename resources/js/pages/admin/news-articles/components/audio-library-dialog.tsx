import { AudioLines, Sparkles } from 'lucide-react';
import { useState } from 'react';
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
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useAudioLibrary } from '@/pages/admin/news-articles/hooks/use-audio-library';

type Props = {
    onSelect: (url: string) => void;
    trigger: React.ReactNode;
    articleId: number;
    canGenerate: boolean;
};

export default function AudioLibraryDialog({
    onSelect,
    trigger,
    articleId,
    canGenerate,
}: Props) {
    const [open, setOpen] = useState(false);
    const {
        items,
        loading,
        generating,
        loadItems,
        generateForArticle,
        deleteItem,
    } = useAudioLibrary();

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (nextOpen) {
            void loadItems();
        }
    };

    const isUsedElsewhere = (item: (typeof items)[number]) =>
        item.news_article_id !== null && item.news_article_id !== articleId;

    const handlePick = (item: (typeof items)[number]) => {
        if (isUsedElsewhere(item)) {
            return;
        }

        onSelect(item.url);
        setOpen(false);
    };

    const handleGenerate = async () => {
        const media = await generateForArticle(articleId);

        if (media) {
            handlePick(media);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Biblioteca de audios</DialogTitle>
                    <DialogDescription>
                        Elegí un audio ya generado o generá uno nuevo con IA a
                        partir de esta noticia
                    </DialogDescription>
                </DialogHeader>

                <div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={generating || !canGenerate}
                        title={
                            canGenerate
                                ? undefined
                                : 'Guardá título, resumen y contenido antes de generar el audio'
                        }
                        onClick={handleGenerate}
                    >
                        {generating ? <Spinner /> : <Sparkles />}
                        Generar narración con IA a partir de esta noticia
                    </Button>
                    {!canGenerate && (
                        <p className="text-muted-foreground mt-2 text-xs">
                            Guardá la noticia con título, resumen y contenido
                            completos para poder narrarla.
                        </p>
                    )}
                </div>

                <div className="max-h-[24rem] overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center py-10">
                            <Spinner />
                        </div>
                    )}

                    {!loading && items.length === 0 && (
                        <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-sm">
                            <AudioLines className="h-8 w-8" />
                            Todavía no hay audios en la biblioteca
                        </div>
                    )}

                    {!loading && items.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Audio</TableHead>
                                    <TableHead>Modelo</TableHead>
                                    <TableHead>Vinculado a</TableHead>
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
                                                <audio
                                                    controls
                                                    src={item.url}
                                                    onClick={(event) =>
                                                        event.stopPropagation()
                                                    }
                                                    className="h-8 max-w-56"
                                                />
                                            </TableCell>
                                            <TableCell className="py-1.5 text-sm">
                                                {item.provider} · {item.model}
                                            </TableCell>
                                            <TableCell className="py-1.5 text-sm">
                                                {item.news_article_id ? (
                                                    usedElsewhere ? (
                                                        <Badge variant="secondary">
                                                            Ya usado en:{' '}
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
                                                    itemLabel="este audio"
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
