import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { DashboardHealthCheck, DashboardHealthStatus } from '@/types/admin';

type Props = {
    checks: DashboardHealthCheck[];
};

const STATUS_STYLES: Record<
    DashboardHealthStatus,
    { icon: typeof CheckCircle2; className: string }
> = {
    ok: { icon: CheckCircle2, className: 'text-green-600 dark:text-green-500' },
    warning: { icon: AlertTriangle, className: 'text-amber-600 dark:text-amber-500' },
    critical: { icon: XCircle, className: 'text-red-600 dark:text-red-500' },
};

export default function DashboardHealthPanel({ checks }: Props) {
    const issues = checks.filter((check) => check.status !== 'ok').length;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Estado del sistema</CardTitle>
                <CardDescription>
                    {issues === 0
                        ? 'Todo en orden, nada que revisar ahora mismo.'
                        : `${issues} cosa(s) para revisar`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="divide-border divide-y">
                    {checks.map((check) => {
                        const { icon: Icon, className } =
                            STATUS_STYLES[check.status];

                        return (
                            <li
                                key={check.label}
                                className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
                            >
                                <Icon
                                    className={`mt-0.5 h-4 w-4 shrink-0 ${className}`}
                                />
                                <div className="min-w-0">
                                    <p className="font-medium">
                                        {check.label}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        {check.detail}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
}
