import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OPEN_CHOOSE_USERNAME_EVENT, sanitizeUsernameInput, validateUsername } from '@/lib/username-rules';
import { useForm, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ChooseUsernameDialog() {
    const { auth } = usePage().props;
    const url = usePage().url;

    const needsUsername = Boolean(auth.user && !auth.user.username);
    const isAlreadyOnSettings = url.startsWith('/perfil/mi-cuenta/ajustes');

    const [open, setOpen] = useState(false);
    const [liveError, setLiveError] = useState<string | null>(null);
    const [hasTyped, setHasTyped] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (needsUsername && !isAlreadyOnSettings && !dismissed) {
            setOpen(true);
        }
    }, [needsUsername, isAlreadyOnSettings, dismissed]);

    useEffect(() => {
        const handleOpenEvent = () => {
            setOpen(true);
        };

        window.addEventListener(OPEN_CHOOSE_USERNAME_EVENT, handleOpenEvent);
        return () => window.removeEventListener(OPEN_CHOOSE_USERNAME_EVENT, handleOpenEvent);
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        setOpen(false);
    };

    const { data, setData, patch, processing, errors } = useForm({
        username: '',
    });

    const handleInputChange = (raw: string) => {
        setHasTyped(true);

        const hasWhitespace = /\s/.test(raw);
        const hasSpecials = /[^a-zA-Z0-9_\s]/.test(raw);

        const cleaned = sanitizeUsernameInput(raw);
        setData('username', cleaned);

        if (hasWhitespace) {
            setLiveError('Los espacios se reemplazan automáticamente por guion bajo (_).');
            return;
        }

        if (hasSpecials) {
            setLiveError('Sin caracteres especiales. Solo letras, números y guion bajo (_).');
            return;
        }

        const validation = validateUsername(cleaned);
        setLiveError(validation.error);
    };

    const isCurrentValid = !liveError && data.username.length >= 3 && data.username.length <= 25;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validation = validateUsername(data.username);
        if (!validation.isValid) {
            setLiveError(validation.error);
            return;
        }

        patch('/perfil/mi-cuenta/ajustes', {
            onSuccess: () => setOpen(false),
        });
    };

    if (!needsUsername || isAlreadyOnSettings) {
        return null;
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    handleDismiss();
                } else {
                    setOpen(true);
                }
            }}
        >
            <DialogContent className="max-w-md rounded-3xl border-neutral-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8 dark:border-neutral-800/80 dark:bg-neutral-900/95">
                <DialogHeader className="items-center text-center">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/20">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl dark:text-neutral-100">
                        Configura tu @nombre de usuario
                    </DialogTitle>
                    <DialogDescription className="mt-1.5 text-xs leading-relaxed text-neutral-500 sm:text-sm dark:text-neutral-400">
                        ¡Bienvenido a KawaiiNews! Para interactuar, dar me gusta y tener tu perfil público, debes elegir un nombre de usuario único.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                Nombre de usuario
                            </label>
                            <span className="font-mono text-[11px] text-neutral-400">
                                {data.username.length}/25
                            </span>
                        </div>

                        <div className="relative">
                            <span className="pointer-events-none absolute top-2.5 left-3.5 text-xs font-semibold text-neutral-400">
                                @
                            </span>
                            <input
                                type="text"
                                value={data.username}
                                onChange={(e) => handleInputChange(e.target.value)}
                                placeholder="ej_darkbot_dv"
                                maxLength={25}
                                className={`w-full rounded-xl border bg-neutral-50/50 pr-9 pl-8 py-2.5 font-mono text-xs text-neutral-900 transition-colors focus:bg-white focus:outline-none dark:bg-neutral-900 dark:text-white ${
                                    liveError || errors.username
                                        ? 'border-rose-500 focus:border-rose-500 dark:border-rose-400'
                                        : isCurrentValid
                                        ? 'border-emerald-500 focus:border-emerald-500 dark:border-emerald-400'
                                        : 'border-neutral-200 focus:border-rose-500 dark:border-neutral-800'
                                }`}
                                required
                                autoFocus
                            />
                            {hasTyped && (
                                <div className="pointer-events-none absolute top-2.5 right-3">
                                    {liveError || errors.username ? (
                                        <AlertCircle className="h-4 w-4 text-rose-500" />
                                    ) : isCurrentValid ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    ) : null}
                                </div>
                            )}
                        </div>

                        {hasTyped && (liveError || errors.username) ? (
                            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-500">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                <span>{liveError || errors.username}</span>
                            </p>
                        ) : (
                            <p className="mt-2 text-[11px] text-neutral-400 dark:text-neutral-500">
                                Máximo 25 caracteres. Se convierte automáticamente a minúsculas. Solo letras, números y guion bajo (_).
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                        <button
                            type="submit"
                            disabled={processing || !isCurrentValid}
                            className="w-full rounded-2xl bg-rose-600 py-3 text-xs font-semibold text-white shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-rose-500 dark:hover:bg-rose-600"
                        >
                            {processing ? 'Guardando...' : 'Guardar y continuar'}
                        </button>
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="w-full rounded-2xl border border-neutral-200/80 bg-neutral-100/60 py-2.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-200/70 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                        >
                            Hacer más tarde
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
