import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAnalyzeWithAi } from '@/pages/admin/news-review/hooks/use-analyze-with-ai';

type Props = {
    disabled?: boolean;
};

export default function AnalyzeWithAiButton({ disabled = false }: Props) {
    const { analyzeWithAi, processing } = useAnalyzeWithAi();

    return (
        <Button
            type="button"
            variant="outline"
            disabled={processing || disabled}
            onClick={analyzeWithAi}
        >
            {processing ? <Spinner /> : <Sparkles />}
            Analizar con IA
        </Button>
    );
}
