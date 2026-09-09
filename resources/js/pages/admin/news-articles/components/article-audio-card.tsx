import { AudioLines, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AudioLibraryDialog from '@/pages/admin/news-articles/components/audio-library-dialog';

type Props = {
    articleId: number;
    value: string;
    onChange: (url: string) => void;
    canGenerate: boolean;
};

export default function ArticleAudioCard({
    articleId,
    value,
    onChange,
    canGenerate,
}: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">
                    Audio narrado
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {value ? (
                    <div className="space-y-2">
                        <audio controls src={value} className="h-8 w-full" />
                        <div className="flex gap-2">
                            <AudioLibraryDialog
                                onSelect={onChange}
                                articleId={articleId}
                                canGenerate={canGenerate}
                                trigger={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                    >
                                        <Mic />
                                        Cambiar
                                    </Button>
                                }
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onChange('')}
                            >
                                Quitar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <AudioLibraryDialog
                            onSelect={onChange}
                            articleId={articleId}
                            canGenerate={canGenerate}
                            trigger={
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                >
                                    <AudioLines />
                                    Elegir audio
                                </Button>
                            }
                        />
                        {!canGenerate && (
                            <p className="text-muted-foreground text-xs">
                                Podés subir un archivo de audio o guardar
                                título, resumen y contenido para narrar con IA.
                            </p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
