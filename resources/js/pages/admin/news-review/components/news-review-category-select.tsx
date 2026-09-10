import { router } from '@inertiajs/react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { index } from '@/routes/admin/news-review';

type Props = {
    value: string | null;
    categories: string[];
};

export default function NewsReviewCategorySelect({ value, categories }: Props) {
    const handleChange = (category: string) => {
        router.get(index().url, category === 'all' ? {} : { category }, {
            preserveState: true,
            preserveScroll: true,
            only: ['clusters', 'category', 'meta'],
        });
    };

    return (
        <Select value={value ?? 'all'} onValueChange={handleChange}>
            <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                    <SelectItem
                        key={category}
                        value={category}
                        className="capitalize"
                    >
                        {category}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
