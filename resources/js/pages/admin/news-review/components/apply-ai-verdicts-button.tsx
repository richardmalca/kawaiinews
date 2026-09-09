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
            disabled={processing || disabled}
            onClick={apply}
        >
            {processing ? <Spinner /> : <CheckCheck />}
            Aceptar todo lo marcado "Publicar"
        </Button>
    );
}
