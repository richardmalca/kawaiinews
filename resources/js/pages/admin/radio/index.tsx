import { Head } from '@inertiajs/react';
import {
    Mic2,
    Music,
    Newspaper,
    RefreshCw,
    Sparkles,
    Trash2,
    Upload,
} from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useRadio } from '@/pages/admin/radio/hooks/use-radio';
import type { RadioQueueItem, RadioTrack } from '@/types/admin';

type Props = {
    tracks: RadioTrack[];
    queue: RadioQueueItem[];
};

function formatDuration(seconds: number | null): string | null {
    if (!seconds) {
        return null;
    }

    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;

    return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

export default function RadioIndex({ tracks: initialTracks, queue }: Props) {
    const {
        tracks,
        uploading,
        rebuilding,
        uploadTrack,
        deleteTrack,
        rebuild,
    } = useRadio(initialTracks, queue);

    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (event: FormEvent) => {
        event.preventDefault();

        if (!file || !title) {
            return;
        }

        const uploaded = await uploadTrack(file, title, artist);

        if (uploaded) {
            setFile(null);
            setTitle('');
            setArtist('');

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <>
            <Head title="KawaiiRadio" />

            <div className="space-y-6 p-4">
                <Heading
                    title="KawaiiRadio"
                    description="Música de fondo mezclada con las últimas noticias, contadas por un locutor con voz de IA. La programación se arma sola cada dos horas."
                />

                <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                <Music className="h-4 w-4" />
                                Agregar música
                            </CardTitle>
                            <CardDescription>
                                Solo música libre de derechos. Buscá en
                                Pixabay Music, YouTube Audio Library, Free
                                Music Archive o Chosic, y subila acá.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleUpload}
                                className="space-y-4"
                            >
                                <div className="grid gap-2">
                                    <Label htmlFor="radio-track-title">
                                        Nombre de la canción
                                    </Label>
                                    <Input
                                        id="radio-track-title"
                                        value={title}
                                        onChange={(event) =>
                                            setTitle(event.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="radio-track-artist">
                                        Artista (opcional)
                                    </Label>
                                    <Input
                                        id="radio-track-artist"
                                        value={artist}
                                        onChange={(event) =>
                                            setArtist(event.target.value)
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="radio-track-file">
                                        Archivo de audio
                                    </Label>
                                    <Input
                                        id="radio-track-file"
                                        ref={fileInputRef}
                                        type="file"
                                        accept="audio/*"
                                        onChange={(event) =>
                                            setFile(
                                                event.target.files?.[0] ??
                                                    null,
                                            )
                                        }
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={uploading || !file || !title}
                                >
                                    {uploading ? (
                                        <Spinner />
                                    ) : (
                                        <Upload className="h-4 w-4" />
                                    )}
                                    Agregar canción
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                <Sparkles className="h-4 w-4" />
                                Programación de ahora
                            </CardTitle>
                            <CardDescription>
                                Se renueva sola con las últimas noticias, o
                                le das al botón para armarla de una.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={rebuilding || tracks.length === 0}
                                onClick={rebuild}
                            >
                                {rebuilding ? (
                                    <Spinner />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                Actualizar ahora
                            </Button>

                            {tracks.length === 0 ? (
                                <p className="text-muted-foreground text-sm">
                                    Agregá al menos una canción para poder
                                    armar la programación.
                                </p>
                            ) : queue.length === 0 ? (
                                <p className="text-muted-foreground text-sm">
                                    Todavía no se armó ninguna programación
                                    — probá "Actualizar ahora".
                                </p>
                            ) : (
                                <ol className="max-h-96 space-y-1 overflow-y-auto text-sm">
                                    {queue.map((item, index) => {
                                        const duration = formatDuration(
                                            item.duration_seconds,
                                        );

                                        return (
                                            <li
                                                key={item.id}
                                                className="flex items-center gap-3 rounded-md px-2 py-1.5 odd:bg-muted/40"
                                            >
                                                <span className="text-muted-foreground w-5 shrink-0 text-right text-xs">
                                                    {index + 1}
                                                </span>
                                                {item.type === 'music' ? (
                                                    <Music className="text-muted-foreground h-4 w-4 shrink-0" />
                                                ) : (
                                                    <Newspaper className="h-4 w-4 shrink-0 text-primary" />
                                                )}
                                                <span className="min-w-0 flex-1 truncate">
                                                    {item.title}
                                                </span>
                                                {duration && (
                                                    <span className="text-muted-foreground shrink-0 text-xs">
                                                        {duration}
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ol>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <Mic2 className="h-4 w-4" />
                            Tu música ({tracks.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tracks.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                Todavía no agregaste ninguna canción.
                            </p>
                        ) : (
                            <ul className="divide-y">
                                {tracks.map((track) => (
                                    <li
                                        key={track.id}
                                        className="flex items-center justify-between gap-4 py-3"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                                                <Music className="text-muted-foreground h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">
                                                    {track.title}
                                                </p>
                                                <p className="text-muted-foreground truncate text-xs">
                                                    {track.artist ??
                                                        'Sin artista'}
                                                    {track.created_at_formatted
                                                        ? ` · agregada el ${track.created_at_formatted}`
                                                        : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="shrink-0"
                                            onClick={() =>
                                                deleteTrack(track)
                                            }
                                        >
                                            <Trash2 className="text-destructive h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

RadioIndex.layout = {
    breadcrumbs: [
        {
            title: 'KawaiiRadio',
            href: '/admin/radio',
        },
    ],
};
