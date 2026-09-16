import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toggleAutoAccept } from '@/routes/admin/news-review';

type Props = {
    enabled: boolean;
    dailyLimit: number;
};

export default function AutoAcceptControl({ enabled, dailyLimit }: Props) {
    const [limit, setLimit] = useState(dailyLimit);
    const [processing, setProcessing] = useState(false);

    const save = (nextEnabled: boolean, nextLimit: number) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.post(
                toggleAutoAccept().url,
                { enabled: nextEnabled, daily_limit: nextLimit },
                {
                    preserveScroll: true,
                    onSuccess: () => resolve(),
                    onError: () => reject(),
                    onFinish: () => setProcessing(false),
                },
            );
        });

        toast.promise(promise, {
            loading: 'Guardando...',
            success: nextEnabled
                ? `Aceptación automática activada: hasta ${nextLimit} noticias por día, sin que tengas que entrar`
                : 'Aceptación automática desactivada',
            error: 'No se pudo guardar',
        });
    };

    return (
        <div className="border-input flex flex-wrap items-center gap-3 rounded-md border px-3 py-2 text-sm">
            <Switch
                id="auto-accept"
                checked={enabled}
                disabled={processing}
                onCheckedChange={(checked) => save(checked, limit)}
            />
            <Label htmlFor="auto-accept" className="cursor-pointer">
                Aceptar automáticamente las mejores noticias todos los días
            </Label>

            <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">hasta</span>
                <Input
                    type="number"
                    min={1}
                    max={20}
                    className="h-8 w-16"
                    value={limit}
                    disabled={processing}
                    onChange={(event) =>
                        setLimit(Number(event.target.value) || 1)
                    }
                    onBlur={() => enabled && save(enabled, limit)}
                />
                <span className="text-muted-foreground">por día</span>
            </div>
        </div>
    );
}
