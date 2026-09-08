import { Link, usePage } from '@inertiajs/react';
import {
    BrainCircuit,
    LayoutGrid,
    Newspaper,
    Rss,
    Search,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes/admin';
import { index as aiProvidersIndex } from '@/routes/admin/ai-providers';
import { index as newsArticlesIndex } from '@/routes/admin/news-articles';
import { index as newsReviewIndex } from '@/routes/admin/news-review';
import { index as newsSourcesIndex } from '@/routes/admin/news-sources';
import { index as usersIndex } from '@/routes/admin/users';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage().props;
    const isSuperadmin = auth.user?.roles.includes('superadmin');
    const canManageUsers = isSuperadmin || auth.user?.roles.includes('admin');

    const platformNavItems: NavItem[] = [
        {
            title: 'Panel',
            href: dashboard(),
            icon: LayoutGrid,
        },
        ...(canManageUsers
            ? [
                  {
                      title: 'Usuarios',
                      href: usersIndex(),
                      icon: Users,
                  },
              ]
            : []),
    ];

    const externalServicesNavItems: NavItem[] = isSuperadmin
        ? [
              {
                  title: 'Modelo de IA',
                  href: aiProvidersIndex(),
                  icon: BrainCircuit,
              },
              {
                  title: 'Fuentes de noticias',
                  href: newsSourcesIndex(),
                  icon: Rss,
              },
          ]
        : [];

    const contentNavItems: NavItem[] = isSuperadmin
        ? [
              {
                  title: 'Revisar noticias',
                  href: newsReviewIndex(),
                  icon: Search,
              },
              {
                  title: 'Noticias',
                  href: newsArticlesIndex(),
                  icon: Newspaper,
              },
          ]
        : [];

    const maintenanceNavItems: NavItem[] = [];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain label="Plataforma" items={platformNavItems} />
                <NavMain label="Contenido" items={contentNavItems} />
                <NavMain
                    label="Servicios externos"
                    items={externalServicesNavItems}
                />
                <NavMain label="Mantenimiento" items={maintenanceNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
