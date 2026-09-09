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
        <Card>
            <CardContent className="flex items-center gap-3">
                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center">
                    <Icon className="text-muted-foreground h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">{label}</p>
                    <p className="truncate text-lg font-semibold">{value}</p>
                    {sublabel && (
                        <p className="text-muted-foreground text-xs">
                            {sublabel}
                        </p>
                    )}
                    {changePercent !== undefined && changePercent !== null && (
                        <ChangeBadge changePercent={changePercent} />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
