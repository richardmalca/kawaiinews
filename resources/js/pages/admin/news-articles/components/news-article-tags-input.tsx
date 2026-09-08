import { X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    tags: string[];
    onChange: (tags: string[]) => void;
    availableTags: string[];
};

export default function NewsArticleTagsInput({
    tags,
    onChange,
    availableTags,
}: Props) {
    const [draft, setDraft] = useState('');

    const addTag = (value: string) => {
        const normalized = value.trim();

        if (normalized === '' || tags.includes(normalized)) {
            return;
        }

        onChange([...tags, normalized]);
        setDraft('');
    };

    const removeTag = (value: string) => {
        onChange(tags.filter((tag) => tag !== value));
    };

    return (
        <div className="grid gap-2">
            <Label htmlFor="tags-input">Tags</Label>
            <Input
                id="tags-input"
                list="available-tags"
                value={draft}
                placeholder="Escribí un tag y presiona Enter"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ',') {
                        event.preventDefault();
                        addTag(draft);
                    }
                }}
            />
            <datalist id="available-tags">
                {availableTags.map((tag) => (
                    <option key={tag} value={tag} />
                ))}
            </datalist>
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="gap-1"
                        >
                            {tag}
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="hover:text-destructive"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
