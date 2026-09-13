import { Head } from '@inertiajs/react';
import { CircleAlert, DollarSign, Sparkles, Zap } from 'lucide-react';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
    moderation: 'Moderación de comentarios (IA)',
};

const numberFormatter = new Intl.NumberFormat('es');

export default function AiUsageIndex({
    month,
    byKind,
    totalCallsThisMonth,
    estimatedCostUsd,
    hasUnknownPricing,
    byModel,
}: Props) {
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
                        value={`$${estimatedCostUsd.toFixed(2)}`}
                        sublabel="Aproximado, según tarifas públicas"
                    />
                    <KpiCard
                        icon={Zap}
                        label="Llamadas a la IA"
                        value={totalCallsThisMonth}
                    />
                    <KpiCard
                        icon={Sparkles}
                        label="Funciones activas"
                        value={Object.keys(byKind).length}
                    />
                </div>

                {Object.keys(byKind).length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        Todavía no hay uso de IA registrado este mes.
                    </p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {Object.entries(byKind).map(([kind, stats]) => (
                                <div
                                    key={kind}
                                    className="bg-card rounded-lg border p-4"
                                >
                                    <p className="font-medium">
                                        {kindLabel[kind] ?? kind}
                                    </p>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        {numberFormatter.format(stats.calls)}{' '}
                                        llamadas ·{' '}
                                        {numberFormatter.format(
                                            stats.prompt_tokens +
                                                stats.completion_tokens,
                                        )}{' '}
                                        tokens
                                    </p>
                                    <p className="mt-1 text-lg font-semibold">
                                        ${stats.estimated_cost_usd.toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="overflow-x-auto">
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
                                            <TableCell>{row.model}</TableCell>
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
                        </div>
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
