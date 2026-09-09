import { ExternalLink, Play, Trash2, Video, Youtube } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Props = {
    body: string;
    onBodyChange: (newBody: string) => void;
};

const extractYoutubeId = (url: string): string | null => {
    const match = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i,
    );
    return match ? match[1] : null;
};

export default function ArticleVideoCard({ body, onBodyChange }: Props) {
    const [inputUrl, setInputUrl] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const existingMatch = body.match(
        /<iframe[^>]+src="https:\/\/www\.youtube\.com\/embed\/([\w-]{11})"[^>]*><\/iframe>/i,
    );
    const currentVideoId = existingMatch ? existingMatch[1] : null;

    const handleApply = () => {
        const videoId = extractYoutubeId(inputUrl.trim());
        if (!videoId) {
            return;
        }

        const embedHtml = `<div class="aspect-video"><iframe src="https://www.youtube.com/embed/${videoId}" title="Video de YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;

        let updatedBody = body;
        if (currentVideoId) {
            updatedBody = updatedBody.replace(
                /<div class="aspect-video"><iframe[^>]+src="https:\/\/www\.youtube\.com\/embed\/[\w-]+"[^>]*><\/iframe><\/div>/gi,
                embedHtml,
            );
        } else {
            updatedBody = `${updatedBody.trim()}\n\n${embedHtml}`;
        }

        onBodyChange(updatedBody);
        setInputUrl('');
        setIsEditing(false);
    };

    const handleRemove = () => {
        const cleaned = body
            .replace(
                /<div class="aspect-video"><iframe[^>]+src="https:\/\/www\.youtube\.com\/embed\/[\w-]+"[^>]*><\/iframe><\/div>/gi,
                '',
            )
            .trim();
        onBodyChange(cleaned);
        setIsEditing(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
                    <Youtube className="h-4 w-4 text-rose-500" />
                    <span>Trailer / Video</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {currentVideoId ? (
                    <div className="space-y-2">
                        <div className="aspect-video overflow-hidden rounded-md border bg-neutral-900">
                            <iframe
                                src={`https://www.youtube.com/embed/${currentVideoId}`}
                                title="Trailer de YouTube"
                                className="h-full w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        {isEditing ? (
                            <div className="space-y-2">
                                <Input
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    value={inputUrl}
                                    onChange={(e) =>
                                        setInputUrl(e.target.value)
                                    }
                                    className="text-xs"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="flex-1"
                                        disabled={
                                            !extractYoutubeId(inputUrl.trim())
                                        }
                                        onClick={handleApply}
                                    >
                                        Actualizar
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Video className="h-3.5 w-3.5" />
                                    Cambiar
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRemove}
                                    title="Quitar video"
                                >
                                    <Trash2 className="text-destructive h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    asChild
                                >
                                    <a
                                        href={`https://www.youtube.com/watch?v=${currentVideoId}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Abrir en YouTube"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-muted-foreground text-xs">
                            Pega un enlace de YouTube para incrustar el trailer
                            o video al pie de la noticia.
                        </p>
                        <Input
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            className="text-xs"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            disabled={!extractYoutubeId(inputUrl.trim())}
                            onClick={handleApply}
                        >
                            <Play className="h-3.5 w-3.5" />
                            Insertar trailer
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
