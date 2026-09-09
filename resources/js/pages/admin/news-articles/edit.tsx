import { Head, usePage } from '@inertiajs/react';
import { Check, FileText, ImageOff, Images } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { formatArticleAsPlainText } from '@/lib/utils';
import ArticleAudioCard from '@/pages/admin/news-articles/components/article-audio-card';
import ArticleCategoryPicker from '@/pages/admin/news-articles/components/article-category-picker';
import ArticlePermalinkField from '@/pages/admin/news-articles/components/article-permalink-field';
import ArticleStatusToggle from '@/pages/admin/news-articles/components/article-status-toggle';
import ArticleVideoCard from '@/pages/admin/news-articles/components/article-video-card';
import MediaLibraryDialog from '@/pages/admin/news-articles/components/media-library-dialog';
import NewsArticleTagsInput from '@/pages/admin/news-articles/components/news-article-tags-input';
import RichTextEditor from '@/pages/admin/news-articles/components/rich-text-editor';
import { Spinner } from '@/components/ui/spinner';
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
    const [excerpt, setExcerpt] = useState(article.excerpt ?? '');
    const [body, setBody] = useState(article.body ?? '');
    const [featuredImage, setFeaturedImage] = useState(
        article.featured_image ?? '',
    );
    const [audioUrl, setAudioUrl] = useState(article.audio_url ?? '');
    const { slug, handleTitleChange, handleSlugChange } = useArticleSlug(
        article.title,
        article.slug,
    );
    const [copiedText, setCopiedText] = useState(false);

    const handleCopyPlainText = async () => {
        try {
            const formatted = formatArticleAsPlainText({
                title,
                excerpt,
                body,
            });
            await navigator.clipboard.writeText(formatted);
            setCopiedText(true);
            toast.success('Noticia copiada en texto plano con pausas');
            setTimeout(() => setCopiedText(false), 2000);
        } catch {
            toast.error('No se pudo copiar el texto');
        }
    };

    const plainBody = body
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const isContentComplete = Boolean(
        title.trim() && excerpt.trim() && plainBody,
    );

    const safeTitle = title.replace(/["“”]/g, '').trim();
    const safeExcerpt = excerpt
        .replace(/["“”]/g, '')
        .slice(0, 180)
        .trim();
    const safeContext = plainBody
        .replace(/["“”]/g, '')
        .slice(0, 200)
        .trim();

    const categoryStyle =
        category === 'gaming'
            ? 'Stylized video game promotional concept art, vibrant dynamic digital gaming illustration, game atmosphere'
            : 'Official 2D Japanese anime key visual illustration, authentic modern animation aesthetic, crisp lineart, cel-shaded coloring, studio animation quality';

    const aiImagePrompt = isContentComplete
        ? `Cinematic editorial illustration in 16:9 widescreen format inspired by the topic: ${safeTitle}. Theme: ${safeExcerpt}. Background atmosphere: ${safeContext}. Art style: ${categoryStyle}, cinematic lighting, colorful scenic environment. Strict constraints: completely textless, no letters, no words, no logos, no watermarks, no subtitles, peaceful fictional video game or anime artwork, no violence, no gore, no realistic human photos.`
        : null;
    const canGenerateAudio = Boolean(
        article.title.trim() &&
        (article.excerpt ?? '').trim() &&
        (article.body ?? '').trim(),
    );

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        saveArticle(article.id, {
            title,
            slug,
            category,
            excerpt,
            body,
            featured_image: featuredImage,
            audio_url: audioUrl,
            status,
            tags,
        });
    };

    return (
        <>
            <Head title={`Editar: ${article.title}`} />

            <form onSubmit={handleSubmit} id="edit-article-form">
                <div className="space-y-6 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <Heading
                            title="Editar noticia"
                            description="Ajusta el contenido antes de publicarla"
                        />
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCopyPlainText}
                                title="Copiar noticia a texto plano con pausas para narración o locución"
                            >
                                {copiedText ? (
                                    <>
                                        <Check className="text-emerald-500" />
                                        <span>Copiado</span>
                                    </>
                                ) : (
                                    <>
                                        <FileText />
                                        <span>Copiar texto</span>
                                    </>
                                )}
                            </Button>
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

                    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                        <div className="space-y-6">
                            <Card>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <input
                                            id="title"
                                            name="title"
                                            required
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

                                    <ArticlePermalinkField
                                        slug={slug}
                                        onChange={handleSlugChange}
                                        error={errors.slug}
                                    />

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
                                                    aiPrompt={aiImagePrompt}
                                                    newsArticleId={article.id}
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
                                            aiPrompt={aiImagePrompt}
                                            newsArticleId={article.id}
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

                            <ArticleAudioCard
                                articleId={article.id}
                                value={audioUrl}
                                onChange={setAudioUrl}
                                canGenerate={canGenerateAudio}
                            />

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
