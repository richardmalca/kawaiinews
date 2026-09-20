import { Head } from '@inertiajs/react';
import { CircleAlert, DollarSign, Sparkles, Zap } from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import KpiCard from '@/pages/admin/dashboard/components/kpi-card';

type KindStats = {
    calls: number;
    prompt_tokens: number;
    completion_tokens: number;
    estimated_cost_usd: number;
};

type ModelRow = {
    kind: string;
    provider: string;
    model: string;
    calls: number;
    prompt_tokens: number;
    completion_tokens: number;
};

type Props = {
    month: string;
    byKind: Record<string, KindStats>;
    totalCallsThisMonth: number;
    estimatedCostUsd: number;
    hasUnknownPricing: boolean;
    byModel: ModelRow[];
};

const kindLabel: Record<string, string> = {
    draft: 'Redacción de artículos',
    image: 'Generación de imágenes',
    analyze: 'Análisis de la bandeja',
    audio: 'Narración de audio',
    moderation: 'Moderación de comentarios (IA)',
    seo_audit: 'Auditoría SEO',
    radio_dj: 'DJ de KawaiiRadio',
};

// Un color propio por función, no la escala de grises del tema — así se
// distingue cada barra/tarjeta de un vistazo. Mismo criterio que
// dashboard/chart-colors.ts.
const kindColor: Record<string, string> = {
    draft: '#3b82f6',
    image: '#8b5cf6',
    analyze: '#ef4444',
    audio: '#22c55e',
    moderation: '#f59e0b',
    seo_audit: '#ec4899',
    radio_dj: '#14b8a6',
};
const fallbackColor = '#64748b';

const numberFormatter = new Intl.NumberFormat('es');
const currencyFormatter = new Intl.NumberFormat('es', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
});

export default function AiUsageIndex({
    month,
    byKind,
    totalCallsThisMonth,
    estimatedCostUsd,
    hasUnknownPricing,
    byModel,
}: Props) {
    const kinds = Object.entries(byKind).sort(
        ([, a], [, b]) => b.estimated_cost_usd - a.estimated_cost_usd,
    );

    const chartData = kinds.map(([kind, stats]) => ({
        kind,
        label: kindLabel[kind] ?? kind,
        cost: Number(stats.estimated_cost_usd.toFixed(4)),
    }));

    const topKind = kinds[0]?.[0];

    return (
        <>
            <Head title="Costo de IA" />

            <div className="space-y-6 p-4">
                <Heading
                    title="Costo de IA"
                    description={`Uso estimado en ${month} — tokens consumidos por cada función que usa un modelo de IA`}
                />

                {hasUnknownPricing && (
                    <Alert>
                        <CircleAlert />
                        <AlertTitle>Estimación parcial</AlertTitle>
                        <AlertDescription>
                            Algunos modelos usados no tienen precio cargado en
                            config/ai_pricing.php, así que el costo estimado de
                            esos no está incluido en el total (solo faltan del
                            cálculo, los tokens sí se cuentan abajo).
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    <KpiCard
                        icon={DollarSign}
                        label="Gasto estimado este mes"
                        value={currencyFormatter.format(estimatedCostUsd)}
                        sublabel="Aproximado, según tarifas públicas"
                    />
                    <KpiCard
                        icon={Zap}
                        label="Llamadas a la IA"
                        value={numberFormatter.format(totalCallsThisMonth)}
                    />
                    <KpiCard
                        icon={Sparkles}
                        label="Funciones activas"
                        value={kinds.length}
                        sublabel={
                            topKind
                                ? `La que más gasta: ${(kindLabel[topKind] ?? topKind).toLowerCase()}`
                                : undefined
                        }
                    />
                </div>

                {kinds.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        Todavía no hay uso de IA registrado este mes.
                    </p>
                ) : (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>Gasto por función</CardTitle>
                            </CardHeader>
                            <CardContent className="h-64 w-full sm:h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={chartData}
                                        layout="vertical"
                                        margin={{
                                            top: 5,
                                            right: 24,
                                            left: 0,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            horizontal={false}
                                            className="stroke-border"
                                        />
                                        <XAxis
                                            type="number"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value: number) =>
                                                `$${value}`
                                            }
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="label"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            width={150}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'var(--muted)' }}
                                            contentStyle={{
                                                backgroundColor:
                                                    'var(--popover)',
                                                borderColor: 'var(--border)',
                                                fontSize: 12,
                                            }}
                                            formatter={(value) => [
                                                currencyFormatter.format(
                                                    Number(value),
                                                ),
                                                'Gasto',
                                            ]}
                                        />
                                        <Bar dataKey="cost" radius={0}>
                                            {chartData.map((entry) => (
                                                <Cell
                                                    key={entry.kind}
                                                    fill={
                                                        kindColor[entry.kind] ??
                                                        fallbackColor
                                                    }
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {kinds.map(([kind, stats]) => (
                                <Card key={kind} className="h-full">
                                    <CardContent className="flex h-full flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="h-2.5 w-2.5 shrink-0"
                                                style={{
                                                    backgroundColor:
                                                        kindColor[kind] ??
                                                        fallbackColor,
                                                }}
                                            />
                                            <p className="font-medium">
                                                {kindLabel[kind] ?? kind}
                                            </p>
                                        </div>
                                        <p className="text-2xl font-semibold">
                                            {currencyFormatter.format(
                                                stats.estimated_cost_usd,
                                            )}
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            {numberFormatter.format(
                                                stats.calls,
                                            )}{' '}
                                            llamadas ·{' '}
                                            {numberFormatter.format(
                                                stats.prompt_tokens +
                                                    stats.completion_tokens,
                                            )}{' '}
                                            tokens
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Detalle por modelo</CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Función</TableHead>
                                            <TableHead>Proveedor</TableHead>
                                            <TableHead>Modelo</TableHead>
                                            <TableHead className="text-right">
                                                Llamadas
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Tokens entrada
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Tokens salida
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {byModel.map((row) => (
                                            <TableRow
                                                key={`${row.kind}-${row.provider}-${row.model}`}
                                            >
                                                <TableCell>
                                                    {kindLabel[row.kind] ??
                                                        row.kind}
                                                </TableCell>
                                                <TableCell className="capitalize">
                                                    {row.provider}
                                                </TableCell>
                                                <TableCell>
                                                    {row.model}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {numberFormatter.format(
                                                        row.calls,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {numberFormatter.format(
                                                        row.prompt_tokens,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {numberFormatter.format(
                                                        row.completion_tokens,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </>
    );
}

AiUsageIndex.layout = {
    breadcrumbs: [
        {
            title: 'Costo de IA',
            href: '/admin/ai-usage',
        },
    ],
};
