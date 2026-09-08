import { Check, Pencil } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';

type Props = {
    slug: string;
    onChange: (value: string) => void;
    error?: string;
};

export default function ArticlePermalinkField({
    slug,
    onChange,
    error,
}: Props) {
    const [editing, setEditing] = useState(false);

    if (editing) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground shrink-0 text-sm">
                    /noticias/
                </span>
                <Input
                    autoFocus
                    value={slug}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            setEditing(false);
                        }
                    }}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(false)}
                >
                    <Check />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-1 text-sm">
            <span className="text-muted-foreground">Enlace permanente:</span>
            <span className="font-medium">/noticias/{slug}</span>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
            >
                <Pencil />
                Editar
            </Button>
            <InputError message={error} />
        </div>
    );
}
