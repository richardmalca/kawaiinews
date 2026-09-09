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
import { CHART_COLORS } from '@/pages/admin/dashboard/chart-colors';
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
            <CardContent className="h-72 w-full sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
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
                        <Bar
                            dataKey="views"
                            name="Vistas"
                            fill={CHART_COLORS.views}
                            radius={[2, 2, 0, 0]}
                        />
                        <Bar
                            dataKey="likes"
                            name="Me gusta"
                            fill={CHART_COLORS.likes}
                            radius={[2, 2, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
