import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useApplyAiVerdicts } from '@/pages/admin/news-review/hooks/use-apply-ai-verdicts';

type Props = {
    disabled?: boolean;
};

export default function ApplyAiVerdictsButton({ disabled = false }: Props) {
    const { apply, processing } = useApplyAiVerdicts();

    return (
        <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={processing || disabled}
            onClick={apply}
            title='Acepta y publica todo lo que la IA marcó como "Publicar"'
        >
            {processing ? <Spinner /> : <CheckCheck />}
            Aplicar veredictos IA
        </Button>
    );
}
