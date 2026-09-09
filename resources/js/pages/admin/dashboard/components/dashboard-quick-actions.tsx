import { Link } from '@inertiajs/react';
import {
    BrainCircuit,
    DatabaseBackup,
    Library,
    Search,
    UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { index as aiProvidersIndex } from '@/routes/admin/ai-providers';
import { index as backupIndex } from '@/routes/admin/backup';
import { index as mediaLibraryIndex } from '@/routes/admin/media-library';
import { index as newsReviewIndex } from '@/routes/admin/news-review';
import { index as usersIndex } from '@/routes/admin/users';

type Action = {
    label: string;
    description: string;
    href: string;
    icon: LucideIcon;
};

const ACTIONS: Action[] = [
    {
        label: 'Revisar noticias',
        description: 'Bandeja de clusters pendientes',
        href: newsReviewIndex().url,
        icon: Search,
    },
    {
        label: 'Biblioteca de medios',
        description: 'Imágenes y audios',
        href: mediaLibraryIndex().url,
        icon: Library,
    },
    {
        label: 'Modelo de IA',
        description: 'Proveedores y API keys',
        href: aiProvidersIndex().url,
        icon: BrainCircuit,
    },
    {
        label: 'Usuarios',
        description: 'Gestionar staff y roles',
        href: usersIndex().url,
        icon: UserPlus,
    },
    {
        label: 'Backups',
        description: 'Exportar o restaurar',
        href: backupIndex().url,
        icon: DatabaseBackup,
    },
];

export default function DashboardQuickActions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Accesos directos</CardTitle>
                <CardDescription>
                    Lo que más se usa, a un click
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {ACTIONS.map((action) => (
                        <Link
                            key={action.label}
                            href={action.href}
                            className="group border-border hover:border-primary/50 hover:bg-muted flex flex-col gap-2 border p-3 transition-colors"
                        >
                            <action.icon className="text-muted-foreground group-hover:text-foreground h-5 w-5" />
                            <div>
                                <p className="text-sm font-medium">
                                    {action.label}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {action.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
