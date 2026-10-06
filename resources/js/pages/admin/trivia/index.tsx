import { Head, router } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { destroy, store } from '@/routes/admin/trivia';

type TriviaOption = {
    id: number;
    label: string;
    is_correct: boolean;
};

type TriviaQuestionRow = {
    id: number;
    question: string;
    active_date: string | null;
    is_active: boolean;
    answers_count: number;
    options: TriviaOption[];
};

type Meta = {
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    questions: TriviaQuestionRow[];
    meta: Meta;
};

type DraftOption = { label: string; is_correct: boolean };

const emptyDraftOptions = (): DraftOption[] => [
    { label: '', is_correct: true },
    { label: '', is_correct: false },
];

export default function TriviaIndex({ questions, meta }: Props) {
    const [question, setQuestion] = useState('');
    const [activeDate, setActiveDate] = useState('');
    const [options, setOptions] = useState<DraftOption[]>(emptyDraftOptions());
    const [processing, setProcessing] = useState(false);

    const addOption = () => {
        if (options.length >= 5) return;
        setOptions([...options, { label: '', is_correct: false }]);
    };

    const removeOption = (index: number) => {
        if (options.length <= 2) return;
        setOptions(options.filter((_, i) => i !== index));
    };

    const updateLabel = (index: number, label: string) => {
        setOptions(options.map((o, i) => (i === index ? { ...o, label } : o)));
    };

    const markCorrect = (index: number) => {
        setOptions(options.map((o, i) => ({ ...o, is_correct: i === index })));
    };

    const resetForm = () => {
        setQuestion('');
        setActiveDate('');
        setOptions(emptyDraftOptions());
    };

    const handleSubmit = () => {
        setProcessing(true);

        router.post(
            store().url,
            { question, active_date: activeDate || null, options },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Pregunta de trivia creada');
                    resetForm();
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(typeof first === 'string' ? first : 'Revisa los campos e intenta nuevamente');
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const handleDelete = (id: number) => {
        router.delete(destroy(id).url, {
            preserveScroll: true,
            onSuccess: () => toast.success('Pregunta eliminada'),
        });
    };

    return (
        <>
            <Head title="Trivia" />

            <div className="space-y-8 p-4">
                <Heading
                    title="Trivia diaria"
                    description="Banco de preguntas de opción múltiple. Cada día puede tener como máximo una pregunta programada."
                />

                <Card>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Pregunta</label>
                            <Input
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="¿Quién es el creador de One Piece?"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-sm font-medium">
                                <CalendarDays className="h-3.5 w-3.5" />
                                Día en que se muestra (opcional, se puede programar para después)
                            </label>
                            <Input
                                type="date"
                                value={activeDate}
                                onChange={(e) => setActiveDate(e.target.value)}
                                className="w-48"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Opciones (marca la correcta)
                            </label>
                            {options.map((option, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Checkbox
                                        checked={option.is_correct}
                                        onCheckedChange={() => markCorrect(index)}
                                        aria-label="Marcar como correcta"
                                    />
                                    <Input
                                        value={option.label}
                                        onChange={(e) => updateLabel(index, e.target.value)}
                                        placeholder={`Opción ${index + 1}`}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        disabled={options.length <= 2}
                                        onClick={() => removeOption(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={options.length >= 5}
                                onClick={addOption}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Agregar opción
                            </Button>
                        </div>

                        <Button
                            type="button"
                            disabled={processing || !question || options.some((o) => !o.label)}
                            onClick={handleSubmit}
                        >
                            Crear pregunta
                        </Button>
                    </CardContent>
                </Card>

                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                        Banco de preguntas ({meta.total})
                    </h3>

                    {questions.map((q) => (
                        <Card key={q.id}>
                            <CardContent className="space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-semibold">{q.question}</p>
                                    <div className="flex items-center gap-2">
                                        {q.active_date && (
                                            <Badge variant="outline">{q.active_date}</Badge>
                                        )}
                                        <Badge variant={q.is_active ? 'default' : 'secondary'}>
                                            {q.is_active ? 'Activa' : 'Inactiva'}
                                        </Badge>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(q.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {q.options.map((option) => (
                                        <span
                                            key={option.id}
                                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                                        >
                                            {option.is_correct && (
                                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                                            )}
                                            {option.label}
                                        </span>
                                    ))}
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    {q.answers_count} respuesta(s) recibidas
                                </p>
                            </CardContent>
                        </Card>
                    ))}

                    {questions.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Todavía no hay preguntas en el banco.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}

TriviaIndex.layout = {
    breadcrumbs: [
        {
            title: 'Trivia',
            href: '/admin/trivia',
        },
    ],
};
