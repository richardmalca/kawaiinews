import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';

export default function AdminDashboard() {
    return (
        <>
            <Head title="Panel" />

            <div className="p-4">
                <Heading
                    title="Panel"
                    description="Bienvenido al panel de administración"
                />
            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Panel',
            href: '/admin',
        },
    ],
};
