import { router } from '@inertiajs/react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { index } from '@/routes/admin/news-review';
import type { NewsReviewSort, NewsReviewView } from '@/types/admin';

type Props = {
    value: string | null;
    categories: string[];
    sort: NewsReviewSort;
    search: string | null;
    view: NewsReviewView;
};

export default function NewsReviewCategorySelect({
    value,
    categories,
    sort,
    search,
    view,
}: Props) {
    const handleChange = (category: string) => {
        router.get(
            index().url,
            {
                sort,
                ...(search ? { search } : {}),
                ...(category === 'all' ? {} : { category }),
                ...(view !== 'pending' ? { view } : {}),
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['clusters', 'category', 'meta'],
            },
        );
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
