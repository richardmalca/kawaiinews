import { Head } from '@inertiajs/react';
import {
    Eye,
    FileText,
    Heart,
    Share2,
    UserPlus,
    Users,
} from 'lucide-react';
import Heading from '@/components/heading';
import DashboardCategoryChart from '@/pages/admin/dashboard/components/dashboard-category-chart';
import DashboardTimelineChart from '@/pages/admin/dashboard/components/dashboard-timeline-chart';
import DashboardTopArticles from '@/pages/admin/dashboard/components/dashboard-top-articles';
import KpiCard from '@/pages/admin/dashboard/components/kpi-card';
import type {
    DashboardCategoryStat,
    DashboardSummary,
    DashboardTimelinePoint,
    DashboardTopArticle,
} from '@/types/admin';

type Props = {
    summary: DashboardSummary;
    timeline: DashboardTimelinePoint[];
    topArticles: DashboardTopArticle[];
    categories: DashboardCategoryStat[];
};

export default function AdminDashboard({
    summary,
    timeline,
    topArticles,
    categories,
}: Props) {
    return (
        <>
            <Head title="Panel" />

            <div className="space-y-6 p-4">
                <Heading
                    title="Panel"
                    description="Cómo le está yendo a KawaiiNews, en números"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    <KpiCard
                        icon={Users}
                        label="Usuarios totales"
                        value={summary.users.total}
                        sublabel={`+${summary.users.new_today} hoy`}
                    />
                    <KpiCard
                        icon={UserPlus}
                        label="Usuarios esta semana"
                        value={summary.users.new_this_week}
                    />
                    <KpiCard
                        icon={Eye}
                        label="Vistas hoy"
                        value={summary.views.today}
                        sublabel={`${summary.views.this_week} esta semana`}
                    />
                    <KpiCard
                        icon={Eye}
                        label="Vistas totales"
                        value={summary.views.total}
                    />
                    <KpiCard
                        icon={Heart}
                        label="Reacciones hoy"
                        value={summary.reactions_today}
                        sublabel="Me gusta + favoritos"
                    />
                    <KpiCard
                        icon={Share2}
                        label="Compartidos hoy"
                        value={summary.shares_today}
                    />
                    <KpiCard
                        icon={FileText}
                        label="Artículos publicados"
                        value={summary.articles.published}
                        sublabel={`${summary.articles.drafts} borradores`}
                    />
                </div>

                <DashboardTimelineChart data={timeline} />

                <div className="grid gap-6 lg:grid-cols-2">
                    <DashboardCategoryChart data={categories} />
                    <DashboardTopArticles articles={topArticles} />
                </div>
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
