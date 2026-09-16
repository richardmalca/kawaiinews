import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
    icon: LucideIcon;
    label: string;
    value: string | number;
    sublabel?: string;
    changePercent?: number | null;
};

function ChangeBadge({ changePercent }: { changePercent: number }) {
    if (changePercent === 0) {
        return (
            <span className="text-muted-foreground flex items-center gap-0.5 text-xs">
                <Minus className="h-3 w-3" />
                sin cambios
            </span>
        );
    }

    const isUp = changePercent > 0;

    return (
        <span
            className={`flex items-center gap-0.5 text-xs ${isUp ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}
        >
            {isUp ? (
                <TrendingUp className="h-3 w-3" />
            ) : (
                <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(changePercent)}% vs. semana anterior
        </span>
    );
}

export default function KpiCard({
    icon: Icon,
    label,
    value,
    sublabel,
    changePercent,
}: Props) {
    return (
        <Card size="sm" className="rounded-xl border border-neutral-200/80 bg-white/90 shadow-2xs transition-all hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/60">
            <CardContent className="flex items-center gap-2.5 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                        {label}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-base font-bold tracking-tight text-neutral-900 sm:text-lg dark:text-neutral-100">
                            {value}
                        </p>
                        {changePercent !== undefined && changePercent !== null && (
                            <ChangeBadge changePercent={changePercent} />
                        )}
                    </div>
                    {sublabel && (
                        <p className="truncate text-[10px] text-neutral-400 dark:text-neutral-500">
                            {sublabel}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
