import { CheckCircle2, CircleAlert, Wrench, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SeoCheck = {
    key: string;
    label: string;
    status: 'ok' | 'warn' | 'fail';
    detail: string;
};

type Props = {
    checks: SeoCheck[];
    // Qué chequeos tienen un campo editable al que llevar al admin — el
    // resto (canónica, JSON-LD) los arma el sistema solo, no hay nada que
    // "arreglar" a mano para esos.
    fixableKeys?: string[];
    onFix?: (key: string) => void;
};

const statusStyles = {
    ok: { icon: CheckCircle2, className: 'text-emerald-500' },
    warn: { icon: CircleAlert, className: 'text-amber-500' },
    fail: { icon: XCircle, className: 'text-destructive' },
} as const;

export default function SeoChecklist({
    checks,
    fixableKeys = [],
    onFix,
}: Props) {
    return (
        <ul className="space-y-2">
            {checks.map((check) => {
                const { icon: Icon, className } = statusStyles[check.status];
                const canFix =
                    check.status !== 'ok' &&
                    onFix &&
                    fixableKeys.includes(check.key);

                return (
                    <li
                        key={check.key}
                        className="flex items-start justify-between gap-2"
                    >
                        <div className="flex items-start gap-2">
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
                        </div>
                        {canFix && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="shrink-0"
                                onClick={() => onFix(check.key)}
                            >
                                <Wrench className="h-3.5 w-3.5" />
                                Arreglar
                            </Button>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
