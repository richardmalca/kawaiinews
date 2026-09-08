import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Card, CardContent } from '@/components/ui/card';
import CreateUserDialog from '@/pages/admin/users/components/create-user-dialog';
import UsersTable from '@/pages/admin/users/components/users-table';
import type { AdminUser } from '@/types/admin';

type Props = {
    users: AdminUser[];
    assignableRoles: string[];
};

export default function UsersIndex({ users, assignableRoles }: Props) {
    return (
        <>
            <Head title="Usuarios" />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Usuarios"
                        description="Administra las cuentas y los roles de acceso"
                    />
                    <CreateUserDialog assignableRoles={assignableRoles} />
                </div>

                <Card>
                    <CardContent>
                        <UsersTable
                            users={users}
                            assignableRoles={assignableRoles}
                        />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Usuarios',
            href: '/admin/users',
        },
    ],
};
