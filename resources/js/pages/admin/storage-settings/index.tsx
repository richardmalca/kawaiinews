import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle2, CloudCog, HardDrive, Image } from 'lucide-react';
import { useState } from 'react';
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
import { useMigrateMedia } from '@/pages/admin/storage-settings/hooks/use-migrate-media';
import { useStorageSettingsForm } from '@/pages/admin/storage-settings/hooks/use-storage-settings-form';
import { useTestStorageConnection } from '@/pages/admin/storage-settings/hooks/use-test-storage-connection';
import storageSettingsRoutes from '@/routes/admin/storage-settings';

type StorageSettings = {
    access_key: string | null;
    has_secret_key: boolean;
    bucket: string | null;
    region: string | null;
    endpoint: string | null;
    use_path_style_endpoint: boolean;
    public_url: string | null;
    public_url_preview: string | null;
    is_configured: boolean;
    active_for_media: boolean;
    active_for_backups: boolean;
    last_verified_at: string | null;
};

type MediaLocation = {
    local: number;
    remote: number;
};

type Props = {
    settings: StorageSettings;
    mediaLocation: MediaLocation;
};

export default function StorageSettingsIndex({
    settings,
    mediaLocation,
}: Props) {
    const { errors } = usePage().props;
    const { save, processing } = useStorageSettingsForm();
    const { testConnection, processing: testing } =
        useTestStorageConnection();
    const { migrate, processing: migrating } = useMigrateMedia();

    const [accessKey, setAccessKey] = useState(settings.access_key ?? '');
    const [secretKey, setSecretKey] = useState('');
    const [bucket, setBucket] = useState(settings.bucket ?? '');
    const [region, setRegion] = useState(settings.region ?? 'us-east-1');
    const [endpoint, setEndpoint] = useState(
        settings.endpoint ?? 'https://s3.wasabisys.com',
    );
    const [usePathStyle, setUsePathStyle] = useState(
        settings.use_path_style_endpoint,
    );
    const [publicUrl, setPublicUrl] = useState(settings.public_url ?? '');

    const [mediaProcessing, setMediaProcessing] = useState(false);
    const [backupsProcessing, setBackupsProcessing] = useState(false);

    const handleSave = () => {
        save({
            access_key: accessKey,
            secret_key: secretKey,
            bucket,
            region,
            endpoint,
            use_path_style_endpoint: usePathStyle,
            public_url: publicUrl,
        });
        setSecretKey('');
    };

    const toggle = (
        url: string,
        enabled: boolean,
        setProcessing: (value: boolean) => void,
        labelOn: string,
        labelOff: string,
    ) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.post(
                url,
                { enabled },
                {
                    preserveScroll: true,
                    onSuccess: () => resolve(),
                    onError: () => reject(),
                    onFinish: () => setProcessing(false),
                },
            );
        });

        toast.promise(promise, {
            loading: 'Guardando...',
            success: enabled ? labelOn : labelOff,
            error: 'No se pudo guardar',
        });
    };

    return (
        <>
            <Head title="Almacenamiento" />

            <div className="space-y-6 p-4">
                <Heading
                    title="Almacenamiento"
                    description="Conectá un almacenamiento S3-compatible (Wasabi, DigitalOcean Spaces, AWS S3...) para medios y/o backups"
                />

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <CloudCog className="h-4 w-4" />
                            Credenciales
                        </CardTitle>
                        <CardDescription>
                            Para Wasabi: el endpoint es de la forma{' '}
                            <code>https://s3.{'{región}'}.wasabisys.com</code>{' '}
                            (o <code>https://s3.wasabisys.com</code> si usás
                            la región por defecto). Nada de esto se guarda en
                            el servidor ni en el código — queda encriptado en
                            la base, igual que las API keys de IA.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="access-key">Access key</Label>
                                <Input
                                    id="access-key"
                                    value={accessKey}
                                    onChange={(e) =>
                                        setAccessKey(e.target.value)
                                    }
                                />
                                <InputError message={errors.access_key} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="secret-key">Secret key</Label>
                                <Input
                                    id="secret-key"
                                    type="password"
                                    placeholder={
                                        settings.has_secret_key
                                            ? '•••••••••••• (sin cambios)'
                                            : ''
                                    }
                                    value={secretKey}
                                    onChange={(e) =>
                                        setSecretKey(e.target.value)
                                    }
                                />
                                <InputError message={errors.secret_key} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bucket">Bucket</Label>
                                <Input
                                    id="bucket"
                                    value={bucket}
                                    onChange={(e) =>
                                        setBucket(e.target.value)
                                    }
                                />
                                <InputError message={errors.bucket} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="region">Región</Label>
                                <Input
                                    id="region"
                                    value={region}
                                    onChange={(e) =>
                                        setRegion(e.target.value)
                                    }
                                />
                                <InputError message={errors.region} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="endpoint">Endpoint</Label>
                                <Input
                                    id="endpoint"
                                    value={endpoint}
                                    onChange={(e) =>
                                        setEndpoint(e.target.value)
                                    }
                                />
                                <InputError message={errors.endpoint} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="public-url">
                                    URL pública (opcional)
                                </Label>
                                <Input
                                    id="public-url"
                                    placeholder={
                                        settings.public_url_preview ??
                                        'Se arma sola con el endpoint + bucket'
                                    }
                                    value={publicUrl}
                                    onChange={(e) =>
                                        setPublicUrl(e.target.value)
                                    }
                                />
                                <p className="text-muted-foreground text-xs">
                                    Solo si tenés un dominio propio o CDN
                                    delante del bucket. Si no, dejalo vacío.
                                </p>
                                <InputError message={errors.public_url} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch
                                id="path-style"
                                checked={usePathStyle}
                                onCheckedChange={setUsePathStyle}
                            />
                            <Label htmlFor="path-style">
                                Path-style endpoint
                            </Label>
                            <span className="text-muted-foreground text-xs">
                                (recomendado para Wasabi)
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                disabled={processing}
                                onClick={handleSave}
                            >
                                {processing && <Spinner />}
                                Guardar
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={testing || !settings.is_configured}
                                onClick={testConnection}
                            >
                                {testing && <Spinner />}
                                Probar conexión
                            </Button>
                            {settings.last_verified_at && (
                                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    Verificado {settings.last_verified_at}
                                </span>
                            )}
                        </div>

                        {!settings.is_configured && (
                            <Alert>
                                <AlertTitle>Faltan datos</AlertTitle>
                                <AlertDescription>
                                    Completá access key, secret key, bucket y
                                    endpoint, y guardá antes de poder probar
                                    la conexión o activar algo.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                <Image className="h-4 w-4" />
                                Medios (imágenes y audio)
                            </CardTitle>
                            <CardDescription>
                                Las imágenes/audios nuevos (subidos o
                                generados con IA) se guardan acá en vez del
                                disco local del servidor. Los que ya estaban
                                guardados siguen funcionando igual, no hace
                                falta migrarlos a mano.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="active-media"
                                    checked={settings.active_for_media}
                                    disabled={
                                        mediaProcessing ||
                                        !settings.is_configured
                                    }
                                    onCheckedChange={(checked) =>
                                        toggle(
                                            storageSettingsRoutes.media.toggle().url,
                                            checked,
                                            setMediaProcessing,
                                            'Medios en Wasabi/S3 activado',
                                            'Medios en Wasabi/S3 desactivado',
                                        )
                                    }
                                />
                                <Label htmlFor="active-media">Activar</Label>
                            </div>

                            {(mediaLocation.local > 0 ||
                                mediaLocation.remote > 0) && (
                                <div className="mt-4 space-y-3 border-t pt-4">
                                    <p className="text-muted-foreground text-sm">
                                        Ahora mismo tenés{' '}
                                        {mediaLocation.local} imagen
                                        {mediaLocation.local === 1
                                            ? ''
                                            : 'es'}{' '}
                                        o audio guardados en este servidor, y{' '}
                                        {mediaLocation.remote} en el
                                        almacenamiento externo.
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        {mediaLocation.local > 0 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    migrating ||
                                                    !settings.is_configured
                                                }
                                                onClick={() =>
                                                    migrate('remote')
                                                }
                                            >
                                                {migrating && <Spinner />}
                                                Llevar todo al
                                                almacenamiento externo
                                            </Button>
                                        )}
                                        {mediaLocation.remote > 0 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={migrating}
                                                onClick={() =>
                                                    migrate('local')
                                                }
                                            >
                                                {migrating && <Spinner />}
                                                Traer todo de vuelta a
                                                este servidor
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        Esto puede tardar un rato si tenés
                                        muchos archivos. Podés seguir usando
                                        el panel mientras se hace, y nada
                                        deja de funcionar mientras tanto.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                <HardDrive className="h-4 w-4" />
                                Backups
                            </CardTitle>
                            <CardDescription>
                                Cada backup que descargues desde{' '}
                                <a
                                    href="/admin/backup"
                                    className="underline"
                                >
                                    Backups
                                </a>{' '}
                                también se sube una copia acá. También podés
                                generar uno directo a Wasabi sin bajarlo al
                                navegador.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="active-backups"
                                    checked={settings.active_for_backups}
                                    disabled={
                                        backupsProcessing ||
                                        !settings.is_configured
                                    }
                                    onCheckedChange={(checked) =>
                                        toggle(
                                            storageSettingsRoutes.backups.toggle().url,
                                            checked,
                                            setBackupsProcessing,
                                            'Backups en Wasabi/S3 activado',
                                            'Backups en Wasabi/S3 desactivado',
                                        )
                                    }
                                />
                                <Label htmlFor="active-backups">
                                    Activar
                                </Label>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

StorageSettingsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Almacenamiento',
            href: '/admin/storage-settings',
        },
    ],
};
