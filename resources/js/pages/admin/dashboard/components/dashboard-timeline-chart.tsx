import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { CHART_COLORS } from '@/pages/admin/dashboard/chart-colors';
import type { DashboardTimelinePoint } from '@/types/admin';

type Props = {
    data: DashboardTimelinePoint[];
};

function formatDay(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
    });
}

export default function DashboardTimelineChart({ data }: Props) {
    const chartData = data.map((point) => ({
        ...point,
        label: formatDay(point.date),
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Actividad de los últimos 14 días</CardTitle>
                <CardDescription>
                    Vistas, usuarios nuevos, reacciones (me gusta + favoritos)
                    y compartidos por día
                </CardDescription>
            </CardHeader>
            <CardContent className="h-72 w-full sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 8, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-border"
                        />
                        <XAxis
                            dataKey="label"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                            minTickGap={20}
                        />
                        <YAxis
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                            width={36}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--popover)',
                                borderColor: 'var(--border)',
                                color: 'var(--popover-foreground)',
                                fontSize: 12,
                            }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: 11 }}
                            iconSize={10}
                        />
                        <Line
                            type="monotone"
                            dataKey="views"
                            name="Vistas"
                            stroke={CHART_COLORS.views}
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="reactions"
                            name="Reacciones"
                            stroke={CHART_COLORS.reactions}
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="shares"
                            name="Compartidos"
                            stroke={CHART_COLORS.shares}
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="users"
                            name="Usuarios nuevos"
                            stroke={CHART_COLORS.users}
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
