import { Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useElapsedSeconds } from '@/hooks/use-elapsed-seconds';

type Props = {
    generating: boolean;
    generationStartedAt: number | null;
};

/**
 * Puramente visual: el estado de generación vive en el edit.tsx (un solo
 * useMediaLibrary() compartido con el diálogo, ver comentario ahí) para
 * que arrancar la generación desde el diálogo y cerrarlo a mitad de
 * camino no pierda el feedback ni permita abrir otro diálogo y generar
 * de nuevo mientras tanto.
 */
export default function ArticleImageGenerationStatus({
    generating,
    generationStartedAt,
}: Props) {
    const elapsed = useElapsedSeconds(generationStartedAt);

    if (!generating) {
        return null;
    }

    return (
        <div className="border-input bg-muted/40 flex items-center gap-2 border border-dashed p-3 text-sm">
            <Spinner className="shrink-0" />
            <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    Generando imagen con IA...
                </p>
                <p className="text-muted-foreground text-xs">
                    Puede tardar hasta 2 minutos ({elapsed}s) — no hace falta
                    generar otra, esta se va a asignar sola cuando termine.
                </p>
            </div>
        </div>
    );
}
