import { CheckCircle2, CircleAlert, XCircle } from 'lucide-react';

type SeoCheck = {
    key: string;
    label: string;
    status: 'ok' | 'warn' | 'fail';
    detail: string;
};

type Props = {
    checks: SeoCheck[];
};

const statusStyles = {
    ok: { icon: CheckCircle2, className: 'text-emerald-500' },
    warn: { icon: CircleAlert, className: 'text-amber-500' },
    fail: { icon: XCircle, className: 'text-destructive' },
} as const;

export default function SeoChecklist({ checks }: Props) {
    return (
        <ul className="space-y-2">
            {checks.map((check) => {
                const { icon: Icon, className } = statusStyles[check.status];

                return (
                    <li key={check.key} className="flex items-start gap-2">
                        <Icon
                            className={`mt-0.5 h-4 w-4 shrink-0 ${className}`}
                        />
                        <div>
                            <p className="text-sm font-medium">
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
    );
}
