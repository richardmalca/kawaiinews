import { BadgeCheck, Newspaper } from 'lucide-react';
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

const roleVariants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    superadmin: 'destructive',
    admin: 'default',
    editor: 'secondary',
};

function formatMemberSince(date: string): string {
    return new Date(date).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

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
                    <TableHead>Rol</TableHead>
                    <TableHead>Artículos publicados</TableHead>
                    <TableHead>Miembro desde</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.length === 0 && (
                    <TableRow>
                        <TableCell
                            colSpan={5}
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
                                <Avatar className="h-9 w-9">
                                    <AvatarImage
                                        src={user.avatar ?? undefined}
                                        alt={user.name}
                                    />
                                    <AvatarFallback className="bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="truncate font-medium">
                                            {user.name}
                                        </p>
                                        {user.email_verified_at && (
                                            <BadgeCheck
                                                className="h-3.5 w-3.5 shrink-0 text-blue-500"
                                                aria-label="Correo verificado"
                                            />
                                        )}
                                    </div>
                                    <p className="text-muted-foreground truncate text-xs">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge
                                variant={
                                    roleVariants[user.role ?? ''] ??
                                    'secondary'
                                }
                            >
                                {roleLabels[user.role ?? ''] ?? user.role}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {user.published_articles_count > 0 ? (
                                <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                                    <Newspaper className="h-3.5 w-3.5" />
                                    {user.published_articles_count}
                                </span>
                            ) : (
                                <span className="text-muted-foreground text-sm">
                                    —
                                </span>
                            )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                            {formatMemberSince(user.created_at)}
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
