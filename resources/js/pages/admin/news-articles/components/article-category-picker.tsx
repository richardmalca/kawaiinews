import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { NewsCategoryCatalog } from '@/types/admin';

type Props = {
    categories: NewsCategoryCatalog;
    value: string;
    onChange: (value: string) => void;
};

export default function ArticleCategoryPicker({
    categories,
    value,
    onChange,
}: Props) {
    return (
        <ToggleGroup
            type="single"
            variant="outline"
            value={value}
            onValueChange={(next) => {
                if (next) {
                    onChange(next);
                }
            }}
            orientation="vertical"
            className="w-full"
        >
            {Object.entries(categories).map(([key, entry]) => (
                <ToggleGroupItem
                    key={key}
                    value={key}
                    className="w-full justify-start"
                >
                    {entry.label}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    );
}
