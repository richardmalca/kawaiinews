import { Head } from '@inertiajs/react';
import { Chrome, Newspaper, ShieldCheck, Users } from 'lucide-react';
import Heading from '@/components/heading';
import { Card, CardContent } from '@/components/ui/card';
import KpiCard from '@/pages/admin/dashboard/components/kpi-card';
import CreateUserDialog from '@/pages/admin/users/components/create-user-dialog';
import UsersTable from '@/pages/admin/users/components/users-table';
import type { AdminUser, AdminUsersKpis } from '@/types/admin';

type Props = {
    users: AdminUser[];
    assignableRoles: string[];
    kpis: AdminUsersKpis;
};

export default function UsersIndex({ users, assignableRoles, kpis }: Props) {
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                    <KpiCard
                        icon={Users}
                        label="Staff total"
                        value={kpis.total}
                        sublabel={`${kpis.by_role.superadmin} superadmin · ${kpis.by_role.admin} admin · ${kpis.by_role.editor} editor`}
                    />
                    <KpiCard
                        icon={ShieldCheck}
                        label="Superadmins"
                        value={kpis.by_role.superadmin}
                    />
                    <KpiCard
                        icon={Chrome}
                        label="Cuentas con Google"
                        value={kpis.google_accounts}
                        sublabel={
                            kpis.password_accounts > 0
                                ? `${kpis.password_accounts} con contraseña`
                                : undefined
                        }
                    />
                    <KpiCard
                        icon={Newspaper}
                        label="Artículos publicados"
                        value={kpis.published_articles}
                        sublabel="Por todo el staff"
                    />
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
