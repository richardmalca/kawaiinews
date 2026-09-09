import { Head, Link } from '@inertiajs/react';
import { AudioLines, Images } from 'lucide-react';
import { useMemo, useState } from 'react';
import DeleteMediaButton from '@/components/delete-media-button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import Heading from '@/components/heading';
import { destroy } from '@/routes/admin/media';
import { edit as editArticle } from '@/routes/admin/news-articles';
import type { MediaItem } from '@/types/admin';

type Props = {
    images: MediaItem[];
    audios: MediaItem[];
};

type Filter = 'all' | 'image' | 'audio';

function readCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

export default function MediaLibraryIndex({
    images: initialImages,
    audios: initialAudios,
}: Props) {
    const [images, setImages] = useState(initialImages);
    const [audios, setAudios] = useState(initialAudios);
    const [filter, setFilter] = useState<Filter>('all');

    const items = useMemo(() => {
        const combined = [...images, ...audios].sort((a, b) => b.id - a.id);

        if (filter === 'all') {
            return combined;
        }

        return combined.filter((item) => item.type === filter);
    }, [images, audios, filter]);

    const handleDelete = async (item: MediaItem) => {
        const response = await fetch(destroy(item.id).url, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-XSRF-TOKEN': readCsrfToken(),
            },
        });

        if (!response.ok) {
            return;
        }

        if (item.type === 'audio') {
            setAudios((current) => current.filter((i) => i.id !== item.id));
        } else {
            setImages((current) => current.filter((i) => i.id !== item.id));
        }
    };

    return (
        <>
            <Head title="Biblioteca de medios" />

            <div className="space-y-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Heading
                        title="Biblioteca de medios"
                        description="Imágenes y audios generados con IA o subidos a mano, con qué modelo se generaron y a qué noticia pertenecen"
                    />

                    <ToggleGroup
                        type="single"
                        variant="outline"
                        value={filter}
                        onValueChange={(next) => {
                            if (next) {
                                setFilter(next as Filter);
                            }
                        }}
                    >
                        <ToggleGroupItem value="all">
                            Todo ({images.length + audios.length})
                        </ToggleGroupItem>
                        <ToggleGroupItem value="image" className="gap-1.5">
                            <Images className="h-4 w-4" />
                            Imágenes ({images.length})
                        </ToggleGroupItem>
                        <ToggleGroupItem value="audio" className="gap-1.5">
                            <AudioLines className="h-4 w-4" />
                            Audios ({audios.length})
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                {items.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        Todavía no hay nada en la biblioteca para este filtro.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Tipo</TableHead>
                                    <TableHead>Contenido</TableHead>
                                    <TableHead>Noticia</TableHead>
                                    <TableHead>Modelo</TableHead>
                                    <TableHead>Fecha y hora</TableHead>
                                    <TableHead className="text-right">
                                        Acciones
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={`${item.type}-${item.id}`}>
                                        <TableCell className="py-1.5">
                                            <Badge
                                                variant="outline"
                                                className="gap-1"
                                            >
                                                {item.type === 'audio' ? (
                                                    <AudioLines className="h-3 w-3" />
                                                ) : (
                                                    <Images className="h-3 w-3" />
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-1.5">
                                            {item.type === 'audio' ? (
                                                <audio
                                                    controls
                                                    src={item.url}
                                                    className="h-8 max-w-56"
                                                />
                                            ) : (
                                                <img
                                                    src={item.url}
                                                    alt={
                                                        item.original_name ?? ''
                                                    }
                                                    className="border-input h-10 w-10 border object-cover"
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate py-1.5">
                                            {item.news_article_id ? (
                                                <Link
                                                    href={
                                                        editArticle(
                                                            item.news_article_id,
                                                        ).url
                                                    }
                                                    className="hover:underline"
                                                >
                                                    {item.article_title ??
                                                        item.original_name}
                                                </Link>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    Sin noticia asociada
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-1.5 text-sm">
                                            {item.provider && item.model ? (
                                                <span>
                                                    {item.provider} ·{' '}
                                                    {item.model}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground capitalize">
                                                    {item.source === 'upload'
                                                        ? 'Subida manual'
                                                        : 'URL externa'}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground py-1.5 text-xs">
                                            {item.created_at_formatted}
                                        </TableCell>
                                        <TableCell className="py-1.5 text-right">
                                            <DeleteMediaButton
                                                itemLabel={
                                                    item.type === 'audio'
                                                        ? 'este audio'
                                                        : 'esta imagen'
                                                }
                                                onConfirm={() =>
                                                    handleDelete(item)
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </>
    );
}

MediaLibraryIndex.layout = {
    breadcrumbs: [
        {
            title: 'Biblioteca de medios',
            href: '/admin/media-library',
        },
    ],
};
