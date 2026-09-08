import { Link, usePage } from '@inertiajs/react';
import { BrainCircuit, LayoutGrid, Rss, Users } from 'lucide-react';
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
import { index as newsSourcesIndex } from '@/routes/admin/news-sources';
import { index as usersIndex } from '@/routes/admin/users';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage().props;
    const isSuperadmin = auth.user?.roles.includes('superadmin');
    const canManageUsers = isSuperadmin || auth.user?.roles.includes('admin');

    const mainNavItems: NavItem[] = [
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
        ...(isSuperadmin
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
            : []),
    ];

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
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
