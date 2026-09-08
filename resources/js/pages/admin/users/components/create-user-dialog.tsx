import { usePage } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import { useCreateUser } from '@/pages/admin/users/hooks/use-create-user';

const roleLabels: Record<string, string> = {
    superadmin: 'Superadmin',
    admin: 'Admin',
    editor: 'Editor',
};

type Props = {
    assignableRoles: string[];
};

export default function CreateUserDialog({ assignableRoles }: Props) {
    const { errors } = usePage().props;
    const [open, setOpen] = useState(false);
    const [role, setRole] = useState(assignableRoles[0] ?? '');

    const { createUser, processing } = useCreateUser(() => setOpen(false));

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        createUser({
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            password_confirmation: formData.get(
                'password_confirmation',
            ) as string,
            role,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="h-4 w-4" />
                    Agregar usuario
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Agregar usuario</DialogTitle>
                    <DialogDescription>
                        Crea una nueva cuenta y asigna su rol
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    id="create-user-form"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            name="name"
                            required
                            autoComplete="name"
                            placeholder="Nombre completo"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Correo electrónico</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="correo@ejemplo.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            required
                            autoComplete="new-password"
                            placeholder="Contraseña"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Confirmar contraseña
                        </Label>
                        <PasswordInput
                            id="password_confirmation"
                            name="password_confirmation"
                            required
                            autoComplete="new-password"
                            placeholder="Confirmar contraseña"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger id="role" className="w-full">
                                <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                            <SelectContent>
                                {assignableRoles.map((assignableRole) => (
                                    <SelectItem
                                        key={assignableRole}
                                        value={assignableRole}
                                    >
                                        {roleLabels[assignableRole] ??
                                            assignableRole}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.role} />
                    </div>
                </form>

                <DialogFooter>
                    <Button
                        type="submit"
                        form="create-user-form"
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        Crear usuario
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
