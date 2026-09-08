import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useInitials } from '@/hooks/use-initials';
import DeleteUserDialog from '@/pages/admin/users/components/delete-user-dialog';
import EditUserDialog from '@/pages/admin/users/components/edit-user-dialog';
import type { AdminUser } from '@/types/admin';

const roleLabels: Record<string, string> = {
    superadmin: 'Superadmin',
    admin: 'Admin',
    editor: 'Editor',
};

type Props = {
    users: AdminUser[];
    assignableRoles: string[];
};

export default function UsersTable({ users, assignableRoles }: Props) {
    const getInitials = useInitials();

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Correo electrónico</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.length === 0 && (
                    <TableRow>
                        <TableCell
                            colSpan={4}
                            className="text-muted-foreground text-center"
                        >
                            No hay usuarios registrados
                        </TableCell>
                    </TableRow>
                )}

                {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage
                                        src={user.avatar ?? undefined}
                                        alt={user.name}
                                    />
                                    <AvatarFallback className="bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                {user.name}
                            </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {user.email}
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary">
                                {roleLabels[user.role ?? ''] ?? user.role}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <EditUserDialog
                                user={user}
                                assignableRoles={assignableRoles}
                            />
                            <DeleteUserDialog user={user} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
