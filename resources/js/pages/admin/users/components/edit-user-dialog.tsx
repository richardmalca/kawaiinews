import { usePage } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
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
import { useUpdateUser } from '@/pages/admin/users/hooks/use-update-user';
import type { AdminUser } from '@/types/admin';

const roleLabels: Record<string, string> = {
    superadmin: 'Superadmin',
    admin: 'Admin',
    editor: 'Editor',
};

type Props = {
    user: AdminUser;
    assignableRoles: string[];
};

export default function EditUserDialog({ user, assignableRoles }: Props) {
    const { errors } = usePage().props;
    const [open, setOpen] = useState(false);
    const [role, setRole] = useState(user.role ?? assignableRoles[0] ?? '');

    const { updateUser, processing } = useUpdateUser(() => setOpen(false));

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        updateUser(user.id, {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            role,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar usuario</DialogTitle>
                    <DialogDescription>
                        Actualiza los datos y el rol de {user.name}
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    id={`edit-user-form-${user.id}`}
                >
                    <div className="grid gap-2">
                        <Label htmlFor={`name-${user.id}`}>Nombre</Label>
                        <Input
                            id={`name-${user.id}`}
                            name="name"
                            required
                            autoComplete="name"
                            defaultValue={user.name}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`email-${user.id}`}>
                            Correo electrónico
                        </Label>
                        <Input
                            id={`email-${user.id}`}
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            defaultValue={user.email}
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`role-${user.id}`}>Rol</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger
                                id={`role-${user.id}`}
                                className="w-full"
                            >
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
                        form={`edit-user-form-${user.id}`}
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        Guardar cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
