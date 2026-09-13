import { Head, router, usePage } from '@inertiajs/react';
import { ImageOff, Images, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
import { Textarea } from '@/components/ui/textarea';
import NewsArticleTagsInput from '@/pages/admin/news-articles/components/news-article-tags-input';
import GoogleSerpPreview from '@/pages/admin/site-settings/components/google-serp-preview';
import { useSiteImageUpload } from '@/pages/admin/site-settings/hooks/use-site-image-upload';
import { useSiteSettingsForm } from '@/pages/admin/site-settings/hooks/use-site-settings-form';
import siteSettingsRoutes from '@/routes/admin/site-settings';

type SiteSettings = {
    name: string;
    description: string | null;
    keywords: string[];
    theme_color: string | null;
    twitter_handle: string | null;
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
    const [description, setDescription] = useState(settings.description ?? '');
    const [keywords, setKeywords] = useState<string[]>(settings.keywords);
    const [themeColor, setThemeColor] = useState(
        settings.theme_color ?? '#ec4899',
    );
    const [twitterHandle, setTwitterHandle] = useState(
        settings.twitter_handle ?? '',
    );

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
            router.delete(siteSettingsRoutes.logo.update().url, {
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

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        save({
            name,
            description,
            keywords,
            theme_color: themeColor,
            twitter_handle: twitterHandle,
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

                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <div className="space-y-6">
                        <form
                            onSubmit={handleSubmit}
                            id="site-settings-form"
                            className="space-y-6"
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">
                                        Identidad
                                    </CardTitle>
                                    <CardDescription>
                                        Nombre y descripción del sitio: se
                                        usan como título/descripción por
                                        defecto en Google y al compartir en
                                        redes cuando una noticia puntual no
                                        tiene los suyos propios.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="site-name">
                                            Nombre del sitio
                                        </Label>
                                        <Input
                                            id="site-name"
                                            value={name}
                                            maxLength={60}
                                            onChange={(event) =>
                                                setName(event.target.value)
                                            }
                                        />
                                        <InputError message={errors.name} />
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
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">
                                        Redes y tema
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="twitter-handle">
                                            Usuario de Twitter/X
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
                                </CardContent>
                            </Card>

                            <Button
                                type="submit"
                                form="site-settings-form"
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Guardar
                            </Button>
                        </form>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Logo
                                </CardTitle>
                                <CardDescription>
                                    Se usa en el panel de administración.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
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
                                    <div className="flex gap-2">
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
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Favicon
                                </CardTitle>
                                <CardDescription>
                                    Subí una sola imagen cuadrada (idealmente
                                    512x512 o más) — se generan
                                    automáticamente los tamaños 32x32,
                                    192x192 (Android) y 180x180
                                    (apple-touch-icon).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
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
                                            src={settings.apple_touch_icon_url}
                                            alt="apple-touch-icon"
                                            className="border-input h-12 w-12 rounded-lg border"
                                            title="apple-touch-icon 180x180"
                                        />
                                    )}
                                    {!settings.favicon_url && (
                                        <p className="text-muted-foreground text-sm">
                                            Todavía usa el favicon estático
                                            del proyecto.
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
                                                    event.target.files?.[0];
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
                                    Imagen de OpenGraph por defecto
                                </CardTitle>
                                <CardDescription>
                                    La imagen que se muestra al compartir un
                                    link del sitio (WhatsApp, X, Facebook,
                                    Discord...) cuando la página no tiene una
                                    imagen propia. Se recorta a 1200x630.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {settings.og_image_url ? (
                                    <img
                                        src={settings.og_image_url}
                                        alt="Imagen de OpenGraph"
                                        className="border-input aspect-[1200/630] w-full max-w-sm rounded border object-cover"
                                    />
                                ) : (
                                    <p className="text-muted-foreground text-sm">
                                        Todavía usa la imagen por defecto del
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
                                                    event.target.files?.[0];
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

                    <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Vista previa en Google
                                </CardTitle>
                                <CardDescription>
                                    Se actualiza en vivo a medida que
                                    escribís (aproximado, Google decide el
                                    corte real).
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <GoogleSerpPreview
                                    name={name}
                                    description={description}
                                    url={settings.canonical_url}
                                    faviconUrl={settings.favicon_url}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
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
