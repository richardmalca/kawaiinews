import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { NewsArticle } from '@/types/admin';

type Props = {
    value: NewsArticle['status'];
    onChange: (value: NewsArticle['status']) => void;
};

export default function ArticleStatusToggle({ value, onChange }: Props) {
    return (
        <ToggleGroup
            type="single"
            variant="outline"
            value={value}
            onValueChange={(next) => {
                if (next) {
                    onChange(next as NewsArticle['status']);
                }
            }}
            className="w-full"
        >
            <ToggleGroupItem value="draft" className="flex-1">
                Borrador
            </ToggleGroupItem>
            <ToggleGroupItem value="published" className="flex-1">
                Publicada
            </ToggleGroupItem>
        </ToggleGroup>
    );
}
