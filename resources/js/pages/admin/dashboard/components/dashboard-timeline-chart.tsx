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
            <CardContent className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 12, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-border"
                        />
                        <XAxis
                            dataKey="label"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--popover)',
                                borderColor: 'var(--border)',
                                color: 'var(--popover-foreground)',
                                fontSize: 12,
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line
                            type="monotone"
                            dataKey="views"
                            name="Vistas"
                            stroke="var(--color-chart-1)"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="reactions"
                            name="Reacciones"
                            stroke="var(--color-chart-2)"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="shares"
                            name="Compartidos"
                            stroke="var(--color-chart-3)"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="users"
                            name="Usuarios nuevos"
                            stroke="var(--color-chart-4)"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
