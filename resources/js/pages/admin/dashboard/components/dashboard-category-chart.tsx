import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
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
import type { DashboardCategoryStat } from '@/types/admin';

type Props = {
    data: DashboardCategoryStat[];
};

export default function DashboardCategoryChart({ data }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Qué gusta más, por categoría</CardTitle>
                <CardDescription>
                    Vistas totales y me gusta acumulados por categoría, sobre
                    los artículos publicados
                </CardDescription>
            </CardHeader>
            <CardContent className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
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
                        <Bar
                            dataKey="views"
                            name="Vistas"
                            fill="var(--color-chart-1)"
                        />
                        <Bar
                            dataKey="likes"
                            name="Me gusta"
                            fill="var(--color-chart-2)"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
