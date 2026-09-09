import { Head, Link, useForm } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import type { PublicCategorySummary } from '@/types';
import { sanitizeUsernameInput, validateUsername } from '@/lib/username-rules';
import { AlertCircle, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface ChooseUsernameProps {
    categories?: Record<string, PublicCategorySummary>;
}

export default function ChooseUsername({ categories }: ChooseUsernameProps) {
    const { data, setData, patch, errors, processing } = useForm({
        username: '',
    });

    const [liveError, setLiveError] = useState<string | null>(null);
    const [hasTyped, setHasTyped] = useState(false);

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
        patch('/perfil/mi-cuenta/ajustes');
    };

    return (
        <PublicLayout categories={categories}>
            <Head title="Elige tu nombre de usuario - KawaiiNews" />

            <div className="mx-auto max-w-2xl space-y-6">
                <div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Volver a la portada</span>
                    </Link>
                </div>

                <div>
                    <h1 className="text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl dark:text-white">
                        Elige tu @nombre de usuario
                    </h1>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        Para tener tu perfil público y compartir noticias en la comunidad KawaiiNews, elige un identificador único.
                    </p>
                </div>

                <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-xs sm:p-8 dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:shadow-none">
                    <form onSubmit={handleSubmit} className="space-y-5">
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
                                    De 3 a 25 caracteres. Se convierte automáticamente a minúsculas. Solo letras, números y guion bajo (_).
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing || !isCurrentValid}
                            className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-rose-500 dark:hover:bg-rose-600"
                        >
                            {processing ? 'Guardando...' : 'Confirmar nombre de usuario'}
                        </button>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}
