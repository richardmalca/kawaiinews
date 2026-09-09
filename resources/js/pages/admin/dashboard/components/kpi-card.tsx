import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
    icon: LucideIcon;
    label: string;
    value: string | number;
    sublabel?: string;
};

export default function KpiCard({ icon: Icon, label, value, sublabel }: Props) {
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
                </div>
            </CardContent>
        </Card>
    );
}
