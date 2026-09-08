import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import ArticleBodyEditor from '@/pages/admin/news-articles/components/article-body-editor';
import NewsArticleTagsInput from '@/pages/admin/news-articles/components/news-article-tags-input';
import { useArticleSlug } from '@/pages/admin/news-articles/hooks/use-article-slug';
import { useSaveNewsArticle } from '@/pages/admin/news-articles/hooks/use-save-news-article';
import type { NewsArticle, NewsCategoryCatalog } from '@/types/admin';

type Props = {
    article: NewsArticle;
    categories: NewsCategoryCatalog;
    availableTags: string[];
};

export default function NewsArticleEdit({
    article,
    categories,
    availableTags,
}: Props) {
    const { errors } = usePage().props;
    const { saveArticle, processing } = useSaveNewsArticle();

    const [title, setTitle] = useState(article.title);
    const [category, setCategory] = useState(article.category);
    const [status, setStatus] = useState<NewsArticle['status']>(
        article.status,
    );
    const [tags, setTags] = useState<string[]>(article.tags);
    const [body, setBody] = useState(article.body ?? '');
    const { slug, handleTitleChange, handleSlugChange } = useArticleSlug(
        article.title,
        article.slug,
    );

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        saveArticle(article.id, {
            title,
            slug,
            category,
            excerpt: formData.get('excerpt') as string,
            body,
            featured_image: formData.get('featured_image') as string,
            status,
            tags,
        });
    };

    return (
        <>
            <Head title={`Editar: ${article.title}`} />

            <div className="space-y-8 p-4">
                <Heading
                    title="Editar noticia"
                    description="Ajusta el contenido antes de publicarla"
                />

                <Card>
                    <CardContent>
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-6"
                            id="edit-article-form"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="title">Título</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    required
                                    value={title}
                                    onChange={(event) => {
                                        setTitle(event.target.value);
                                        handleTitleChange(event.target.value);
                                    }}
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    required
                                    value={slug}
                                    onChange={(event) =>
                                        handleSlugChange(event.target.value)
                                    }
                                />
                                <InputError message={errors.slug} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="category">
                                        Categoría
                                    </Label>
                                    <Select
                                        value={category}
                                        onValueChange={setCategory}
                                    >
                                        <SelectTrigger
                                            id="category"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(categories).map(
                                                ([key, entry]) => (
                                                    <SelectItem
                                                        key={key}
                                                        value={key}
                                                    >
                                                        {entry.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.category} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="status">Estado</Label>
                                    <Select
                                        value={status}
                                        onValueChange={(value) =>
                                            setStatus(
                                                value as NewsArticle['status'],
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            id="status"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">
                                                Borrador
                                            </SelectItem>
                                            <SelectItem value="published">
                                                Publicada
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="featured_image">
                                    Imagen destacada (URL)
                                </Label>
                                <Input
                                    id="featured_image"
                                    name="featured_image"
                                    type="url"
                                    defaultValue={
                                        article.featured_image ?? ''
                                    }
                                />
                                <InputError
                                    message={errors.featured_image}
                                />
                            </div>

                            <NewsArticleTagsInput
                                tags={tags}
                                onChange={setTags}
                                availableTags={availableTags}
                            />

                            <div className="grid gap-2">
                                <Label htmlFor="excerpt">Resumen</Label>
                                <Textarea
                                    id="excerpt"
                                    name="excerpt"
                                    rows={2}
                                    defaultValue={article.excerpt ?? ''}
                                />
                                <InputError message={errors.excerpt} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="body">Contenido</Label>
                                <ArticleBodyEditor
                                    value={body}
                                    onChange={setBody}
                                />
                                <InputError message={errors.body} />
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        form="edit-article-form"
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        Guardar
                    </Button>
                </div>
            </div>
        </>
    );
}

NewsArticleEdit.layout = {
    breadcrumbs: [
        {
            title: 'Noticias',
            href: '/admin/news-articles',
        },
        {
            title: 'Editar',
            href: '#',
        },
    ],
};
