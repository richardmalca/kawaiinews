import { Form, Head, Link, usePage } from '@inertiajs/react';
import { CloudOff, Download, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import DatabaseBackupController from '@/actions/App/Http/Controllers/Admin/DatabaseBackupController';
import { useRemoteBackups } from '@/pages/admin/backup/hooks/use-remote-backups';
import backupRoutes, { download } from '@/routes/admin/backup';
import { edit as storageSettingsEdit } from '@/routes/admin/storage-settings';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

type Props = {
    remoteConfigured: boolean;
    remoteActiveForBackups: boolean;
};

const sizeFormatter = (bytes: number) => {
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(0)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function BackupIndex({
    remoteConfigured,
    remoteActiveForBackups,
}: Props) {
    const { auth } = usePage<PageProps>().props;
    const confirmEmailInput = useRef<HTMLInputElement>(null);
    const { backupsList, loading, backingUp, backupNow, deleteBackup } =
        useRemoteBackups(remoteActiveForBackups);

    return (
        <>
            <Head title="Backups" />

            <div className="space-y-8 p-4">
                <Heading
                    title="Backups"
                    description="Exportá o restaurá la base de datos completa"
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Descargar backup</CardTitle>
                        <CardDescription>
                            Genera un archivo .sql.gz con todas las tablas de
                            datos reales (noticias, usuarios, medios,
                            interacciones). No incluye tablas transitorias
                            como caché o sesiones.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <a href={download().url}>Descargar backup</a>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Backups en almacenamiento remoto</CardTitle>
                        <CardDescription>
                            {remoteConfigured ? (
                                <>
                                    Cada backup que descargues arriba también
                                    sube una copia acá si está activado en{' '}
                                    <Link
                                        href={storageSettingsEdit().url}
                                        className="underline"
                                    >
                                        Almacenamiento
                                    </Link>
                                    . También podés generar uno directo, sin
                                    pasar por el navegador.
                                </>
                            ) : (
                                'No configuraste todavía un almacenamiento remoto (Wasabi/S3).'
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!remoteConfigured ? (
                            <Button variant="outline" asChild>
                                <Link href={storageSettingsEdit().url}>
                                    Configurar almacenamiento
                                </Link>
                            </Button>
                        ) : !remoteActiveForBackups ? (
                            <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                <CloudOff className="h-4 w-4" />
                                Activá "Backups" en{' '}
                                <Link
                                    href={storageSettingsEdit().url}
                                    className="underline"
                                >
                                    Almacenamiento
                                </Link>{' '}
                                para usar esto.
                            </div>
                        ) : (
                            <>
                                <Button
                                    type="button"
                                    disabled={backingUp}
                                    onClick={backupNow}
                                >
                                    {backingUp && <Spinner />}
                                    Generar backup ahora
                                </Button>

                                {loading ? (
                                    <p className="text-muted-foreground text-sm">
                                        Cargando...
                                    </p>
                                ) : backupsList.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">
                                        Todavía no hay backups remotos.
                                    </p>
                                ) : (
                                    <ul className="divide-y">
                                        {backupsList.map((backup) => (
                                            <li
                                                key={backup.name}
                                                className="flex flex-wrap items-center justify-between gap-2 py-2"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {backup.name}
                                                    </p>
                                                    <Badge
                                                        variant="outline"
                                                        className="mt-0.5"
                                                    >
                                                        {sizeFormatter(
                                                            backup.size,
                                                        )}
                                                    </Badge>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <a
                                                            href={
                                                                backupRoutes.remote.download(
                                                                    backup.name,
                                                                ).url
                                                            }
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            deleteBackup(
                                                                backup.name,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-red-100 dark:border-red-200/10">
                    <CardHeader>
                        <CardTitle>Restaurar backup</CardTitle>
                        <CardDescription>
                            Sube un archivo .sql.gz para restaurar la base de
                            datos. Esto SOBREESCRIBE todas las tablas
                            actuales con lo que haya en el archivo — no se
                            puede deshacer.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="destructive">
                                    Restaurar desde archivo
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>
                                    ¿Restaurar la base de datos?
                                </DialogTitle>
                                <DialogDescription>
                                    Todas las tablas actuales se van a
                                    reemplazar por las del archivo que subas.
                                    Escribí tu correo ({auth.user.email}) para
                                    confirmar.
                                </DialogDescription>

                                <Form
                                    {...DatabaseBackupController.restore.form()}
                                    encType="multipart/form-data"
                                    onError={() =>
                                        confirmEmailInput.current?.focus()
                                    }
                                    resetOnSuccess
                                    className="space-y-4"
                                >
                                    {({
                                        resetAndClearErrors,
                                        processing,
                                        errors,
                                    }) => (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="backup">
                                                    Archivo .sql.gz
                                                </Label>
                                                <Input
                                                    id="backup"
                                                    name="backup"
                                                    type="file"
                                                    accept=".gz"
                                                    required
                                                />
                                                <InputError
                                                    message={errors.backup}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="confirm_email">
                                                    Tu correo, para confirmar
                                                </Label>
                                                <Input
                                                    id="confirm_email"
                                                    name="confirm_email"
                                                    type="email"
                                                    ref={confirmEmailInput}
                                                    placeholder={
                                                        auth.user.email
                                                    }
                                                    autoComplete="off"
                                                />
                                                <InputError
                                                    message={
                                                        errors.confirm_email
                                                    }
                                                />
                                            </div>

                                            <DialogFooter className="gap-2">
                                                <DialogClose asChild>
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() =>
                                                            resetAndClearErrors()
                                                        }
                                                    >
                                                        Cancelar
                                                    </Button>
                                                </DialogClose>

                                                <Button
                                                    variant="destructive"
                                                    disabled={processing}
                                                    asChild
                                                >
                                                    <button type="submit">
                                                        Restaurar
                                                    </button>
                                                </Button>
                                            </DialogFooter>
                                        </>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

BackupIndex.layout = {
    breadcrumbs: [
        {
            title: 'Backups',
            href: '/admin/backup',
        },
    ],
};
