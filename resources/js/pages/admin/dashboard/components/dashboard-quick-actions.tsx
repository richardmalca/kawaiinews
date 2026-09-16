import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BrainCircuit,
    DatabaseBackup,
    Library,
    Newspaper,
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
import { index as authorStatsIndex } from '@/routes/admin/my-articles';
import { index as mediaLibraryIndex } from '@/routes/admin/media-library';
import { create as newsArticleCreate } from '@/routes/admin/news-articles';
import { index as newsReviewIndex } from '@/routes/admin/news-review';
import { index as usersIndex } from '@/routes/admin/users';

type Action = {
    label: string;
    description: string;
    href: string;
    icon: LucideIcon;
    roles?: string[];
};

const ACTIONS: Action[] = [
    {
        label: 'Nueva noticia',
        description: 'Redactar un nuevo artículo',
        href: newsArticleCreate().url,
        icon: Newspaper,
        roles: ['superadmin', 'admin', 'editor'],
    },
    {
        label: 'Mis noticias',
        description: 'Estadísticas de mis notas',
        href: authorStatsIndex().url,
        icon: BarChart3,
        roles: ['superadmin', 'admin', 'editor'],
    },
    {
        label: 'Biblioteca de medios',
        description: 'Imágenes y audios',
        href: mediaLibraryIndex().url,
        icon: Library,
        roles: ['superadmin', 'admin', 'editor'],
    },
    {
        label: 'Revisar noticias',
        description: 'Bandeja de clusters pendientes',
        href: newsReviewIndex().url,
        icon: Search,
        roles: ['superadmin'],
    },
    {
        label: 'Modelo de IA',
        description: 'Proveedores y API keys',
        href: aiProvidersIndex().url,
        icon: BrainCircuit,
        roles: ['superadmin'],
    },
    {
        label: 'Usuarios',
        description: 'Gestionar staff y roles',
        href: usersIndex().url,
        icon: UserPlus,
        roles: ['superadmin', 'admin'],
    },
    {
        label: 'Backups',
        description: 'Exportar o restaurar',
        href: backupIndex().url,
        icon: DatabaseBackup,
        roles: ['superadmin'],
    },
];

export default function DashboardQuickActions() {
    const { auth } = usePage().props;
    const userRoles = auth.user?.roles ?? [];

    const visibleActions = ACTIONS.filter((action) => {
        if (!action.roles) return true;
        return action.roles.some((role) => userRoles.includes(role));
    });

    if (visibleActions.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Accesos directos</CardTitle>
                <CardDescription className="text-xs">
                    Lo que más se usa en tu rol, a un click
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {visibleActions.map((action) => (
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
