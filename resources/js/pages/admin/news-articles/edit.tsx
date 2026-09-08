import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import NewsArticleTagsInput from '@/pages/admin/news-articles/components/news-article-tags-input';
import RichTextEditor from '@/pages/admin/news-articles/components/rich-text-editor';
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
    const [status, setStatus] = useState<NewsArticle['status']>(article.status);
    const [tags, setTags] = useState<string[]>(article.tags);
    const [body, setBody] = useState(article.body ?? '');
    const [featuredImage, setFeaturedImage] = useState(
        article.featured_image ?? '',
    );
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
            featured_image: featuredImage,
            status,
            tags,
        });
    };

    return (
        <>
            <Head title={`Editar: ${article.title}`} />

            <form onSubmit={handleSubmit} id="edit-article-form">
                <div className="space-y-8 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <Heading
                            title="Editar noticia"
                            description="Ajusta el contenido antes de publicarla"
                        />
                        <Button
                            type="submit"
                            form="edit-article-form"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Guardar
                        </Button>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                        <div className="space-y-6">
                            <Card>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="title">Título</Label>
                                        <Input
                                            id="title"
                                            name="title"
                                            required
                                            className="h-11 text-base font-medium"
                                            value={title}
                                            onChange={(event) => {
                                                setTitle(event.target.value);
                                                handleTitleChange(
                                                    event.target.value,
                                                );
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
                                                handleSlugChange(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError message={errors.slug} />
                                    </div>

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
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">
                                        Contenido
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <RichTextEditor
                                        value={body}
                                        onChange={setBody}
                                    />
                                    <InputError message={errors.body} />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">
                                        Estado
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
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
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">
                                        Categoría
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
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
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">
                                        Etiquetas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <NewsArticleTagsInput
                                        tags={tags}
                                        onChange={setTags}
                                        availableTags={availableTags}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">
                                        Imagen destacada
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Input
                                        id="featured_image"
                                        name="featured_image"
                                        type="url"
                                        placeholder="https://..."
                                        value={featuredImage}
                                        onChange={(event) =>
                                            setFeaturedImage(event.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.featured_image}
                                    />
                                    {featuredImage && (
                                        <img
                                            src={featuredImage}
                                            alt=""
                                            className="w-full border border-input object-cover"
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </form>
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
