import { Head } from '@inertiajs/react';
import { Music, Radio as RadioIcon, RefreshCw, Trash2, Upload } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useRadio } from '@/pages/admin/radio/hooks/use-radio';
import type { RadioQueueItem, RadioTrack } from '@/types/admin';

type Props = {
    tracks: RadioTrack[];
    queue: RadioQueueItem[];
};

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
                    description="Música libre de derechos intercalada con las últimas noticias, presentadas por un DJ con voz de IA — la cola se arma de antemano, no en vivo por oyente."
                />

                <Alert>
                    <RadioIcon className="h-4 w-4" />
                    <AlertTitle>El reproductor todavía no está en la web pública</AlertTitle>
                    <AlertDescription>
                        Esta pantalla arma la música y la cola. El
                        endpoint público que la sirve es{' '}
                        <code>/radio/queue.json</code>.
                    </AlertDescription>
                </Alert>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Subir música
                            </CardTitle>
                            <CardDescription>
                                Solo música libre de derechos (CC0 /
                                royalty-free) — Pixabay Music, YouTube Audio
                                Library, Free Music Archive, Chosic.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleUpload}
                                className="space-y-4"
                            >
                                <div className="grid gap-2">
                                    <Label htmlFor="radio-track-title">
                                        Título
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
                                        Archivo (mp3, wav, ogg, m4a)
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
                                    Subir pista
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Cola actual
                            </CardTitle>
                            <CardDescription>
                                Se reconstruye sola cada 2 horas con las
                                últimas noticias narradas — o de una, con
                                el botón.
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
                                Reconstruir cola ahora
                            </Button>

                            {tracks.length === 0 && (
                                <p className="text-muted-foreground text-sm">
                                    Subí al menos una pista de música para
                                    poder armar la cola.
                                </p>
                            )}

                            <ul className="max-h-80 space-y-1 overflow-y-auto text-sm">
                                {queue.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex items-center gap-2"
                                    >
                                        <Badge
                                            variant="outline"
                                            className="w-16 shrink-0 justify-center"
                                        >
                                            {item.type === 'music'
                                                ? 'Música'
                                                : 'Noticia'}
                                        </Badge>
                                        <span className="truncate">
                                            {item.title}
                                        </span>
                                    </li>
                                ))}
                                {queue.length === 0 && (
                                    <p className="text-muted-foreground text-sm">
                                        Todavía no se armó ninguna cola.
                                    </p>
                                )}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">
                            Música cargada ({tracks.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tracks.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                Todavía no subiste ninguna pista.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Título</TableHead>
                                        <TableHead>Artista</TableHead>
                                        <TableHead>Subida</TableHead>
                                        <TableHead className="text-right">
                                            Acciones
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tracks.map((track) => (
                                        <TableRow key={track.id}>
                                            <TableCell className="flex items-center gap-2 font-medium">
                                                <Music className="text-muted-foreground h-4 w-4" />
                                                {track.title}
                                            </TableCell>
                                            <TableCell>
                                                {track.artist ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                {track.created_at_formatted}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        deleteTrack(track)
                                                    }
                                                >
                                                    <Trash2 className="text-destructive h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
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
