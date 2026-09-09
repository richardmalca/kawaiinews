import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
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
import DatabaseBackupController from '@/actions/App/Http/Controllers/Admin/DatabaseBackupController';
import { download } from '@/routes/admin/backup';

export default function BackupIndex() {
    const passwordInput = useRef<HTMLInputElement>(null);

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
                                    Ingresá tu contraseña para confirmar.
                                </DialogDescription>

                                <Form
                                    {...DatabaseBackupController.restore.form()}
                                    encType="multipart/form-data"
                                    onError={() =>
                                        passwordInput.current?.focus()
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
                                                <Label htmlFor="password">
                                                    Contraseña
                                                </Label>
                                                <PasswordInput
                                                    id="password"
                                                    name="password"
                                                    ref={passwordInput}
                                                    placeholder="Contraseña"
                                                    autoComplete="current-password"
                                                />
                                                <InputError
                                                    message={errors.password}
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
