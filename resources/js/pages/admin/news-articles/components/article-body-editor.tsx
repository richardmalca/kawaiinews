import { Bold, Italic, Underline } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTextFormatting } from '@/pages/admin/news-articles/hooks/use-text-formatting';

type Props = {
    value: string;
    onChange: (value: string) => void;
};

export default function ArticleBodyEditor({ value, onChange }: Props) {
    const { textareaRef, applyBold, applyItalic, applyUnderline } =
        useTextFormatting(value, onChange);

    return (
        <div className="space-y-2">
            <div className="flex gap-1 border-b pb-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyBold}
                >
                    <Bold className="h-4 w-4" />
                    <span className="sr-only">Negrita</span>
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyItalic}
                >
                    <Italic className="h-4 w-4" />
                    <span className="sr-only">Cursiva</span>
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyUnderline}
                >
                    <Underline className="h-4 w-4" />
                    <span className="sr-only">Subrayado</span>
                </Button>
            </div>
            <Textarea
                id="body"
                name="body"
                ref={textareaRef}
                rows={12}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
                Selecciona texto y usa los botones para aplicar formato:
                **negrita**, *cursiva*, &lt;u&gt;subrayado&lt;/u&gt;
            </p>
        </div>
    );
}
