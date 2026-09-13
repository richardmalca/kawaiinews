import { router } from '@inertiajs/react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { index } from '@/routes/admin/news-review';
import type { NewsReviewSort } from '@/types/admin';

type Props = {
    value: NewsReviewSort;
    category: string | null;
    search: string | null;
};

export default function NewsReviewSortSelect({
    value,
    category,
    search,
}: Props) {
    const handleChange = (sort: string) => {
        router.get(
            index().url,
            {
                sort,
                ...(category ? { category } : {}),
                ...(search ? { search } : {}),
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['clusters', 'sort'],
            },
        );
    };

    return (
        <Select value={value} onValueChange={handleChange}>
            <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="relevance">Relevancia</SelectItem>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="oldest">Más antiguas</SelectItem>
            </SelectContent>
        </Select>
    );
}
