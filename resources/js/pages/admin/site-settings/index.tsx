import { Head, router, usePage } from '@inertiajs/react';
import {
    Image as ImageIcon,
    ImageOff,
    Images,
    Palette,
    Search,
    Share2,
    Sparkles,
    Upload,
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import NewsArticleTagsInput from '@/pages/admin/news-articles/components/news-article-tags-input';
import GoogleSerpPreview from '@/pages/admin/site-settings/components/google-serp-preview';
import SeoChecklist from '@/pages/admin/site-settings/components/seo-checklist';
import { useSeoAudit } from '@/pages/admin/site-settings/hooks/use-seo-audit';
import { useSiteImageUpload } from '@/pages/admin/site-settings/hooks/use-site-image-upload';
import { useSiteSettingsForm } from '@/pages/admin/site-settings/hooks/use-site-settings-form';
import siteSettingsRoutes from '@/routes/admin/site-settings';

type SiteSettings = {
    name: string;
    seo_title: string | null;
    description: string | null;
    keywords: string[];
    theme_color: string | null;
    twitter_handle: string | null;
    facebook_url: string | null;
    instagram_url: string | null;
    tiktok_url: string | null;
    search_box_enabled: boolean;
    logo_url: string | null;
    favicon_url: string | null;
    favicon_192_url: string | null;
    apple_touch_icon_url: string | null;
    og_image_url: string | null;
    canonical_url: string;
};

type Props = {
    settings: SiteSettings;
};

export default function SiteSettingsIndex({ settings }: Props) {
    const { errors } = usePage().props;
    const { save, processing } = useSiteSettingsForm();

    const [name, setName] = useState(settings.name);
    const [seoTitle, setSeoTitle] = useState(settings.seo_title ?? '');
    const [description, setDescription] = useState(settings.description ?? '');
    const [keywords, setKeywords] = useState<string[]>(settings.keywords);
    const [themeColor, setThemeColor] = useState(
        settings.theme_color ?? '#ec4899',
    );
    const [twitterHandle, setTwitterHandle] = useState(
        settings.twitter_handle ?? '',
    );
    const [facebookUrl, setFacebookUrl] = useState(
        settings.facebook_url ?? '',
    );
    const [instagramUrl, setInstagramUrl] = useState(
        settings.instagram_url ?? '',
    );
    const [tiktokUrl, setTiktokUrl] = useState(settings.tiktok_url ?? '');
    const [searchBoxEnabled, setSearchBoxEnabled] = useState(
        settings.search_box_enabled,
    );
    const [searchBoxProcessing, setSearchBoxProcessing] = useState(false);
    const { result: auditResult, loading: auditLoading, runAudit } =
        useSeoAudit();

    const logoUpload = useSiteImageUpload(
        siteSettingsRoutes.logo.update().url,
        'logo',
        'Subiendo logo...',
        'Logo actualizado',
    );
    const faviconUpload = useSiteImageUpload(
        siteSettingsRoutes.favicon.update().url,
        'favicon',
        'Generando los tamaños del favicon...',
        'Favicon actualizado',
    );
    const ogImageUpload = useSiteImageUpload(
        siteSettingsRoutes.ogImage.update().url,
        'og_image',
        'Subiendo imagen...',
        'Imagen de OpenGraph actualizada',
    );

    const removeLogo = () => {
        const promise = new Promise<void>((resolve, reject) => {
            router.delete(siteSettingsRoutes.logo.destroy().url, {
                preserveScroll: true,
                onSuccess: () => resolve(),
                onError: () => reject(),
            });
        });

        toast.promise(promise, {
            loading: 'Quitando logo...',
            success: 'Logo quitado',
            error: 'No se pudo quitar el logo',
        });
    };

    const toggleSearchBox = (checked: boolean) => {
        setSearchBoxEnabled(checked);
        setSearchBoxProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.post(
                siteSettingsRoutes.searchBox.update().url,
                { enabled: checked },
                {
                    preserveScroll: true,
                    onSuccess: () => resolve(),
                    onError: () => {
                        setSearchBoxEnabled(!checked);
                        reject();
                    },
                    onFinish: () => setSearchBoxProcessing(false),
                },
            );
        });

        toast.promise(promise, {
            loading: 'Guardando...',
            success: checked
                ? 'Buscador activado'
                : 'Buscador desactivado',
            error: 'No se pudo guardar',
        });
    };

    // Un solo save() para todos los campos de texto (el backend los guarda
    // juntos) pero disparado por botones sueltos en cada tab, no por un
    // <form> compartido: las tabs (Radix) desmontan el contenido inactivo,
    // así que un <form> que envuelva todo se rompería al cambiar de tab.
    const handleSave = () => {
        save({
            name,
            seo_title: seoTitle,
            description,
            keywords,
            theme_color: themeColor,
            twitter_handle: twitterHandle,
            facebook_url: facebookUrl,
            instagram_url: instagramUrl,
            tiktok_url: tiktokUrl,
        });
    };

    return (
        <>
            <Head title="Configuración del sitio" />

            <div className="space-y-6 p-4">
                <Heading
                    title="Configuración del sitio"
                    description="Nombre, logo, favicon e imagen que se usan en el sitio y al compartir un link en redes"
                />

                <Tabs defaultValue="identity">
                    <TabsList>
                        <TabsTrigger value="identity">
                            Identidad y SEO
                        </TabsTrigger>
                        <TabsTrigger value="audit">
                            <Search />
                            Auditoría SEO
                        </TabsTrigger>
                        <TabsTrigger value="images">
                            <ImageIcon />
                            Imágenes
                        </TabsTrigger>
                        <TabsTrigger value="social">
                            <Share2 />
                            Redes sociales
                        </TabsTrigger>
                        <TabsTrigger value="appearance">
                            <Palette />
                            Apariencia
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="identity">
                        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">
                                        Identidad
                                    </CardTitle>
                                    <CardDescription>
                                        Se usan como título/descripción por
                                        defecto en Google y al compartir en
                                        redes cuando una noticia puntual no
                                        tiene los suyos propios.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="site-name">
                                            Nombre / marca
                                        </Label>
                                        <Input
                                            id="site-name"
                                            value={name}
                                            maxLength={60}
                                            onChange={(event) =>
                                                setName(event.target.value)
                                            }
                                        />
                                        <p className="text-muted-foreground text-xs">
                                            El nombre corto: aparece en el
                                            sidebar del panel y al final de
                                            cada noticia ("Título - {name ||
                                            'Nombre'}").
                                        </p>
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="site-seo-title">
                                            Título para Google
                                        </Label>
                                        <Input
                                            id="site-seo-title"
                                            placeholder={
                                                name ||
                                                'Ej: KawaiiNews - Noticias de Anime, Manga y Videojuegos'
                                            }
                                            value={seoTitle}
                                            maxLength={70}
                                            onChange={(event) =>
                                                setSeoTitle(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <p className="text-muted-foreground text-xs">
                                            El título completo que se ve en
                                            los resultados de búsqueda y al
                                            compartir la portada (no una
                                            noticia puntual). Si lo dejás
                                            vacío, se usa el nombre de
                                            arriba.
                                        </p>
                                        <InputError
                                            message={errors.seo_title}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="site-description">
                                            Descripción
                                        </Label>
                                        <Textarea
                                            id="site-description"
                                            rows={3}
                                            maxLength={200}
                                            value={description}
                                            onChange={(event) =>
                                                setDescription(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={errors.description}
                                        />
                                    </div>

                                    <NewsArticleTagsInput
                                        tags={keywords}
                                        onChange={setKeywords}
                                        availableTags={[]}
                                    />
                                    <p className="text-muted-foreground text-xs">
                                        Se usan en la etiqueta{' '}
                                        <code>meta keywords</code>. Google ya
                                        no les da mucho peso, pero otros
                                        buscadores y herramientas sí las
                                        leen.
                                    </p>

                                    <Button
                                        type="button"
                                        disabled={processing}
                                        onClick={handleSave}
                                    >
                                        {processing && <Spinner />}
                                        Guardar
                                    </Button>
                                </CardContent>
                            </Card>

                            <div className="lg:sticky lg:top-4 lg:self-start">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">
                                            Vista previa en Google
                                        </CardTitle>
                                        <CardDescription>
                                            Se actualiza en vivo a medida que
                                            escribís (aproximado, Google
                                            decide el corte real).
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <GoogleSerpPreview
                                            title={seoTitle || name}
                                            description={description}
                                            url={settings.canonical_url}
                                            faviconUrl={settings.favicon_url}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="audit" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Buscador de Google (sitelinks search box)
                                </CardTitle>
                                <CardDescription>
                                    Le dice a Google que puede mostrar una
                                    cajita de búsqueda del sitio debajo del
                                    resultado, apuntando a tu propio buscador
                                    (la portada ya filtra artículos con
                                    ?q=...). Google decide si la muestra o
                                    no, esto solo la habilita.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="search-box-enabled"
                                        checked={searchBoxEnabled}
                                        disabled={searchBoxProcessing}
                                        onCheckedChange={toggleSearchBox}
                                    />
                                    <Label htmlFor="search-box-enabled">
                                        Activar
                                    </Label>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Análisis del sitio
                                </CardTitle>
                                <CardDescription>
                                    Le pega una request real a tu portada y
                                    revisa las tags que efectivamente está
                                    sirviendo (no lo que dice esta pantalla —
                                    así se nota si algo se rompió en el
                                    camino).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button
                                    type="button"
                                    disabled={auditLoading}
                                    onClick={runAudit}
                                >
                                    {auditLoading ? (
                                        <Spinner />
                                    ) : (
                                        <Search className="h-4 w-4" />
                                    )}
                                    Analizar ahora
                                </Button>

                                {auditResult && (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <p className="mb-2 text-sm font-medium">
                                                Checklist
                                            </p>
                                            <SeoChecklist
                                                checks={auditResult.checks}
                                            />
                                        </div>
                                        <div>
                                            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                                                <Sparkles className="h-4 w-4" />
                                                Opinión de la IA
                                            </p>
                                            {auditResult.ai_review ? (
                                                <p className="text-muted-foreground text-sm whitespace-pre-line">
                                                    {auditResult.ai_review}
                                                </p>
                                            ) : (
                                                <Alert>
                                                    <AlertTitle>
                                                        Sin análisis de IA
                                                    </AlertTitle>
                                                    <AlertDescription>
                                                        No hay un proveedor de
                                                        IA de texto activo
                                                        (Modelo de IA), así
                                                        que solo se muestra
                                                        el checklist
                                                        automático.
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>

                                        <div className="sm:col-span-2">
                                            <p className="mb-2 text-sm font-medium">
                                                Tags detectadas en el inicio
                                            </p>
                                            <div className="bg-muted grid gap-x-4 gap-y-1 border p-3 text-xs sm:grid-cols-[140px_1fr]">
                                                {Object.entries(
                                                    auditResult.tags,
                                                ).map(([key, value]) => (
                                                    <Fragment key={key}>
                                                        <span className="text-muted-foreground font-mono">
                                                            {key}
                                                        </span>
                                                        <span className="break-all">
                                                            {value ?? (
                                                                <span className="text-destructive">
                                                                    (vacío)
                                                                </span>
                                                            )}
                                                        </span>
                                                    </Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="images">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">
                                        Logo
                                    </CardTitle>
                                    <CardDescription>
                                        Se usa en el panel de administración.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="border-input bg-muted flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border">
                                        {settings.logo_url ? (
                                            <img
                                                src={settings.logo_url}
                                                alt="Logo"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <Images className="text-muted-foreground h-6 w-6" />
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={logoUpload.processing}
                                            asChild
                                        >
                                            <label className="cursor-pointer">
                                                {logoUpload.processing ? (
                                                    <Spinner />
                                                ) : (
                                                    <Upload className="h-4 w-4" />
                                                )}
                                                Subir logo
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(event) => {
                                                        const file =
                                                            event.target
                                                                .files?.[0];
                                                        if (file) {
                                                            logoUpload.upload(
                                                                file,
                                                            );
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </Button>
                                        {settings.logo_url && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={removeLogo}
                                            >
                                                <ImageOff className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">
                                        Favicon
                                    </CardTitle>
                                    <CardDescription>
                                        Una imagen cuadrada (idealmente
                                        512x512+) — se generan solos los
                                        tamaños 32x32, 192x192 (Android) y
                                        180x180 (apple-touch-icon).
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        {settings.favicon_url && (
                                            <img
                                                src={settings.favicon_url}
                                                alt="Favicon 32x32"
                                                className="border-input h-8 w-8 rounded border"
                                                title="32x32"
                                            />
                                        )}
                                        {settings.favicon_192_url && (
                                            <img
                                                src={settings.favicon_192_url}
                                                alt="Favicon 192x192"
                                                className="border-input h-12 w-12 rounded border"
                                                title="192x192"
                                            />
                                        )}
                                        {settings.apple_touch_icon_url && (
                                            <img
                                                src={
                                                    settings.apple_touch_icon_url
                                                }
                                                alt="apple-touch-icon"
                                                className="border-input h-12 w-12 rounded-lg border"
                                                title="apple-touch-icon 180x180"
                                            />
                                        )}
                                        {!settings.favicon_url && (
                                            <p className="text-muted-foreground text-sm">
                                                Usando el favicon estático del
                                                proyecto.
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={faviconUpload.processing}
                                        asChild
                                    >
                                        <label className="w-fit cursor-pointer">
                                            {faviconUpload.processing ? (
                                                <Spinner />
                                            ) : (
                                                <Upload className="h-4 w-4" />
                                            )}
                                            Subir favicon
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(event) => {
                                                    const file =
                                                        event.target
                                                            .files?.[0];
                                                    if (file) {
                                                        faviconUpload.upload(
                                                            file,
                                                        );
                                                    }
                                                }}
                                            />
                                        </label>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">
                                        Imagen de OpenGraph
                                    </CardTitle>
                                    <CardDescription>
                                        Se muestra al compartir un link del
                                        sitio (WhatsApp, X, Facebook,
                                        Discord...) cuando la página no tiene
                                        una imagen propia. Se recorta a
                                        1200x630.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {settings.og_image_url ? (
                                        <img
                                            src={settings.og_image_url}
                                            alt="Imagen de OpenGraph"
                                            className="border-input aspect-[1200/630] w-full rounded border object-cover"
                                        />
                                    ) : (
                                        <p className="text-muted-foreground text-sm">
                                            Usando la imagen por defecto del
                                            proyecto (og-default.png).
                                        </p>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={ogImageUpload.processing}
                                        asChild
                                    >
                                        <label className="w-fit cursor-pointer">
                                            {ogImageUpload.processing ? (
                                                <Spinner />
                                            ) : (
                                                <Upload className="h-4 w-4" />
                                            )}
                                            Subir imagen
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(event) => {
                                                    const file =
                                                        event.target
                                                            .files?.[0];
                                                    if (file) {
                                                        ogImageUpload.upload(
                                                            file,
                                                        );
                                                    }
                                                }}
                                            />
                                        </label>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="social">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Redes sociales
                                </CardTitle>
                                <CardDescription>
                                    Los perfiles oficiales del sitio. Se usan
                                    para relacionar el sitio con sus cuentas
                                    de cara a Google (además de mostrarse
                                    donde tu sesión de frontend decida
                                    ponerlos, como el footer).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="twitter-handle">
                                        X (Twitter)
                                    </Label>
                                    <Input
                                        id="twitter-handle"
                                        placeholder="tu_usuario"
                                        value={twitterHandle}
                                        onChange={(event) =>
                                            setTwitterHandle(
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="instagram-url">
                                        Instagram
                                    </Label>
                                    <Input
                                        id="instagram-url"
                                        type="url"
                                        placeholder="https://instagram.com/tu_usuario"
                                        value={instagramUrl}
                                        onChange={(event) =>
                                            setInstagramUrl(
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.instagram_url}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="facebook-url">
                                        Facebook
                                    </Label>
                                    <Input
                                        id="facebook-url"
                                        type="url"
                                        placeholder="https://facebook.com/tu_pagina"
                                        value={facebookUrl}
                                        onChange={(event) =>
                                            setFacebookUrl(event.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.facebook_url}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="tiktok-url">
                                        TikTok
                                    </Label>
                                    <Input
                                        id="tiktok-url"
                                        type="url"
                                        placeholder="https://tiktok.com/@tu_usuario"
                                        value={tiktokUrl}
                                        onChange={(event) =>
                                            setTiktokUrl(event.target.value)
                                        }
                                    />
                                    <InputError message={errors.tiktok_url} />
                                </div>

                                <Button
                                    type="button"
                                    className="w-fit"
                                    disabled={processing}
                                    onClick={handleSave}
                                >
                                    {processing && <Spinner />}
                                    Guardar
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="appearance">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Apariencia
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid max-w-xs gap-2">
                                    <Label htmlFor="theme-color">
                                        Color de tema
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="theme-color"
                                            type="color"
                                            className="h-9 w-14 p-1"
                                            value={themeColor}
                                            onChange={(event) =>
                                                setThemeColor(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <Input
                                            value={themeColor}
                                            onChange={(event) =>
                                                setThemeColor(
                                                    event.target.value,
                                                )
                                            }
                                            className="font-mono"
                                        />
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        Color de la barra del navegador en
                                        celular (Android/iOS).
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    disabled={processing}
                                    onClick={handleSave}
                                >
                                    {processing && <Spinner />}
                                    Guardar
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

SiteSettingsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Configuración del sitio',
            href: '/admin/site-settings',
        },
    ],
};
