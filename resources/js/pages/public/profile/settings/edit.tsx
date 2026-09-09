import { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import type { PublicCategorySummary } from '@/types';
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Trash2, User } from 'lucide-react';
import { sanitizeUsernameInput, validateUsername } from '@/lib/username-rules';

interface ProfileSettingsEditProps {
    mustVerifyEmail: boolean;
    status?: string;
    categories?: Record<string, PublicCategorySummary>;
}

export default function ProfileSettingsEdit({
    mustVerifyEmail,
    status,
    categories,
}: ProfileSettingsEditProps) {
    const { auth } = usePage().props;
    const user = auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
        show_shares_on_profile: Boolean(user.show_shares_on_profile),
    });

    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const {
        data: deleteData,
        setData: setDeleteData,
        delete: destroyAccount,
        processing: deleting,
        errors: deleteErrors,
    } = useForm({
        password: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/perfil/${user.username}/ajustes`);
    };

    const handleDeleteAccount = (e: React.FormEvent) => {
        e.preventDefault();
        destroyAccount(`/perfil/${user.username}/ajustes`);
    };

    return (
        <PublicLayout categories={categories}>
            <Head title="Ajustes de perfil y cuenta - KawaiiNews" />

            <div className="mx-auto max-w-2xl space-y-6">
                <div>
                    <Link
                        href={user.username ? `/perfil/${user.username}` : '/'}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>{user.username ? 'Volver a mi perfil' : 'Volver a la portada'}</span>
                    </Link>
                </div>

                <div>
                    <h1 className="text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl dark:text-white">
                        Ajustes de Perfil
                    </h1>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        Administra tus datos públicos, tu nombre de usuario y tu privacidad.
                    </p>
                </div>

                <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-xs sm:p-8 dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:shadow-none">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs text-neutral-900 transition-colors focus:border-rose-500 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:focus:border-rose-400"
                                required
                            />
                            {errors.name && (
                                <p className="mt-1 text-[11px] text-rose-500">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Nombre de usuario (@usuario)
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
                                    maxLength={25}
                                    onChange={(e) => {
                                        const cleaned = sanitizeUsernameInput(e.target.value);
                                        setData('username', cleaned);
                                        const validation = validateUsername(cleaned);
                                        setUsernameError(validation.error);
                                    }}
                                    className={`w-full rounded-xl border bg-neutral-50/50 pr-9 pl-8 py-2.5 font-mono text-xs text-neutral-900 transition-colors focus:bg-white focus:outline-none dark:bg-neutral-900 dark:text-white ${
                                        usernameError || errors.username
                                            ? 'border-rose-500 focus:border-rose-500 dark:border-rose-400'
                                            : 'border-neutral-200 focus:border-rose-500 dark:border-neutral-800'
                                    }`}
                                    required
                                />
                                <div className="pointer-events-none absolute top-2.5 right-3">
                                    {usernameError || errors.username ? (
                                        <AlertCircle className="h-4 w-4 text-rose-500" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    )}
                                </div>
                            </div>
                            {usernameError || errors.username ? (
                                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-rose-500">
                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                    <span>{usernameError || errors.username}</span>
                                </p>
                            ) : (
                                <p className="mt-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                                    De 3 a 25 caracteres. Minúsculas, números y guion bajo (_).
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs text-neutral-900 transition-colors focus:border-rose-500 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:focus:border-rose-400"
                                required
                            />
                            {errors.email && (
                                <p className="mt-1 text-[11px] text-rose-500">{errors.email}</p>
                            )}
                        </div>

                        <div className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800/80 dark:bg-neutral-900/40">
                            <input
                                id="show_shares"
                                type="checkbox"
                                checked={data.show_shares_on_profile}
                                onChange={(e) => setData('show_shares_on_profile', e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-rose-600 focus:ring-rose-500 dark:border-neutral-700 dark:bg-neutral-800"
                            />
                            <label htmlFor="show_shares" className="cursor-pointer text-xs">
                                <span className="font-semibold text-neutral-900 dark:text-white">
                                    Mostrar noticias que compartí en mi perfil público
                                </span>
                                <p className="text-neutral-500 dark:text-neutral-400">
                                    Si lo activas, otros usuarios podrán ver los últimos artículos que compartiste desde tu perfil.
                                </p>
                            </label>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-rose-700 disabled:opacity-50 dark:bg-rose-500 dark:hover:bg-rose-600"
                            >
                                {recentlySuccessful ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        <span>Guardado</span>
                                    </>
                                ) : (
                                    <span>Guardar cambios</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="rounded-3xl border border-red-200/60 bg-white p-6 shadow-xs sm:p-8 dark:border-red-900/30 dark:bg-neutral-900/60 dark:shadow-none">
                    <h2 className="text-base font-bold tracking-tight text-red-600 dark:text-red-400">
                        Eliminar cuenta
                    </h2>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        Una vez eliminada la cuenta, todos tus datos y actividad serán eliminados permanentemente.
                    </p>

                    {!deleteConfirm ? (
                        <button
                            type="button"
                            onClick={() => setDeleteConfirm(true)}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Eliminar mi cuenta</span>
                        </button>
                    ) : (
                        <form onSubmit={handleDeleteAccount} className="mt-4 max-w-sm space-y-3">
                            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                Ingresa tu contraseña para confirmar:
                            </label>
                            <input
                                type="password"
                                value={deleteData.password}
                                onChange={(e) => setDeleteData('password', e.target.value)}
                                className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2 text-xs text-neutral-900 focus:border-red-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                                required
                            />
                            {deleteErrors.password && (
                                <p className="text-[11px] text-red-500">{deleteErrors.password}</p>
                            )}
                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    type="submit"
                                    disabled={deleting}
                                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    Confirmar eliminación
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeleteConfirm(false)}
                                    className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-400"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
