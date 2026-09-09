import { usePage } from '@inertiajs/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { openChooseUsernameModal } from '@/lib/username-rules';

export function UsernameRequiredBanner() {
    const { auth } = usePage().props;
    const url = usePage().url;

    if (!auth.user || auth.user.username) {
        return null;
    }

    if (url.startsWith('/perfil/mi-cuenta/ajustes')) {
        return null;
    }

    return (
        <div className="border-b border-amber-200/80 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 px-4 py-2.5 text-neutral-900 backdrop-blur-md dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:bg-amber-500/30 dark:text-amber-400">
                        <Sparkles className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-medium">
                        ¡Hola, <strong className="font-semibold text-neutral-950 dark:text-white">{auth.user.name}</strong>! Aún no has configurado tu nombre de usuario único (@usuario).
                    </span>
                </div>
                <button
                    type="button"
                    onClick={openChooseUsernameModal}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-neutral-950 px-3 py-1 text-xs font-semibold text-white shadow-xs transition-all hover:bg-neutral-800 dark:bg-amber-400 dark:text-neutral-950 dark:hover:bg-amber-300"
                >
                    <span>Elegir mi @usuario</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}
