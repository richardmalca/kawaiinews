import { Head, usePage } from '@inertiajs/react';
import { ImageOff, Images } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import ArticleCategoryPicker from '@/pages/admin/news-articles/components/article-category-picker';
import ArticlePermalinkField from '@/pages/admin/news-articles/components/article-permalink-field';
import ArticleStatusToggle from '@/pages/admin/news-articles/components/article-status-toggle';
import ArticleVideoCard from '@/pages/admin/news-articles/components/article-video-card';
import MediaLibraryDialog from '@/pages/admin/news-articles/components/media-library-dialog';
import NewsArticleTagsInput from '@/pages/admin/news-articles/components/news-article-tags-input';
import RichTextEditor from '@/pages/admin/news-articles/components/rich-text-editor';
import { useArticleSlug } from '@/pages/admin/news-articles/hooks/use-article-slug';
import { useCreateNewsArticle } from '@/pages/admin/news-articles/hooks/use-create-news-article';
import type { NewsArticle, NewsCategoryCatalog } from '@/types/admin';

type Props = {
    categories: NewsCategoryCatalog;
    availableTags: string[];
};

export default function NewsArticleCreate({
    categories,
    availableTags,
}: Props) {
    const { errors } = usePage().props;
    const { createArticle, processing } = useCreateNewsArticle();

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(Object.keys(categories)[0] ?? '');
    const [status, setStatus] = useState<NewsArticle['status']>('draft');
    const [tags, setTags] = useState<string[]>([]);
    const [excerpt, setExcerpt] = useState('');
    const [body, setBody] = useState('');
    const [featuredImage, setFeaturedImage] = useState('');
    const { slug, handleTitleChange, handleSlugChange } = useArticleSlug(
        '',
        '',
    );

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        createArticle({
            title,
            slug,
            category,
            excerpt,
            body,
            featured_image: featuredImage,
            status,
            tags,
        });
    };

    return (
        <>
            <Head title="Nueva noticia" />

            <form onSubmit={handleSubmit} id="create-article-form">
                <div className="space-y-6 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <Heading
                            title="Nueva noticia"
                            description="Cargala a mano en vez de esperar al scraping automático"
                        />
                        <Button
                            type="submit"
                            form="create-article-form"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Crear noticia
                        </Button>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                        <div className="space-y-6">
                            <Card>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <input
                                            id="title"
                                            name="title"
                                            required
                                            autoFocus
                                            placeholder="Título de la noticia"
                                            className="border-input placeholder:text-muted-foreground focus-visible:border-primary w-full border-0 border-b bg-transparent px-0 py-2 text-2xl font-semibold outline-none"
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

                                    {slug && (
                                        <ArticlePermalinkField
                                            slug={slug}
                                            onChange={handleSlugChange}
                                            error={errors.slug}
                                        />
                                    )}

                                    <div className="grid gap-2 pt-2">
                                        <label
                                            htmlFor="excerpt"
                                            className="text-sm font-medium"
                                        >
                                            Resumen
                                        </label>
                                        <Textarea
                                            id="excerpt"
                                            name="excerpt"
                                            rows={2}
                                            placeholder="Un par de oraciones que resuman la noticia..."
                                            value={excerpt}
                                            onChange={(event) =>
                                                setExcerpt(event.target.value)
                                            }
                                        />
                                        <InputError
                                            message={errors.excerpt}
                                        />
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

                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1 lg:gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">
                                        Estado
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ArticleStatusToggle
                                        value={status}
                                        onChange={setStatus}
                                    />
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
                                    <ArticleCategoryPicker
                                        categories={categories}
                                        value={category}
                                        onChange={setCategory}
                                    />
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
                                    {featuredImage ? (
                                        <div className="space-y-2">
                                            <img
                                                src={featuredImage}
                                                alt=""
                                                className="border-input aspect-video w-full border object-cover"
                                            />
                                            <div className="flex gap-2">
                                                <MediaLibraryDialog
                                                    onSelect={setFeaturedImage}
                                                    trigger={
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1"
                                                        >
                                                            <Images />
                                                            Cambiar
                                                        </Button>
                                                    }
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setFeaturedImage('')
                                                    }
                                                >
                                                    <ImageOff />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <MediaLibraryDialog
                                            onSelect={setFeaturedImage}
                                            trigger={
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full"
                                                >
                                                    <Images />
                                                    Elegir imagen
                                                </Button>
                                            }
                                        />
                                    )}
                                    <InputError
                                        message={errors.featured_image}
                                    />
                                </CardContent>
                            </Card>

                            <p className="text-muted-foreground text-xs">
                                El audio narrado se puede generar después de
                                crear la noticia, desde la pantalla de
                                edición.
                            </p>

                            <ArticleVideoCard
                                body={body}
                                onBodyChange={setBody}
                            />
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}

NewsArticleCreate.layout = {
    breadcrumbs: [
        {
            title: 'Noticias',
            href: '/admin/news-articles',
        },
        {
            title: 'Nueva',
            href: '#',
        },
    ],
};
