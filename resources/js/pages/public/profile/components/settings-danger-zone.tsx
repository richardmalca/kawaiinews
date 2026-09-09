import { Trash2 } from 'lucide-react';

interface SettingsDangerZoneProps {
    deleteConfirm: boolean;
    deleting: boolean;
    passwordValue: string;
    passwordError?: string;
    onToggleConfirm: (val: boolean) => void;
    onPasswordChange: (val: string) => void;
    onDeleteSubmit: (e: React.FormEvent) => void;
}

export function SettingsDangerZone({
    deleteConfirm,
    deleting,
    passwordValue,
    passwordError,
    onToggleConfirm,
    onPasswordChange,
    onDeleteSubmit,
}: SettingsDangerZoneProps) {
    return (
        <div className="overflow-hidden rounded-3xl border border-red-200/60 bg-white p-6 shadow-xs sm:p-8 dark:border-red-900/30 dark:bg-neutral-900/60 dark:shadow-none">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-sm font-bold tracking-tight text-red-600 dark:text-red-400">
                        Zona de peligro: Eliminar cuenta
                    </h2>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                        Al eliminar tu cuenta se borrarán de forma definitiva tu perfil, favoritos e interacciones.
                    </p>
                </div>

                {!deleteConfirm ? (
                    <button
                        type="button"
                        onClick={() => onToggleConfirm(true)}
                        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Eliminar cuenta</span>
                    </button>
                ) : null}
            </div>

            {deleteConfirm && (
                <form onSubmit={onDeleteSubmit} className="mt-5 max-w-sm space-y-3 border-t border-red-100 pt-5 dark:border-red-950/50">
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        Confirma tu contraseña:
                    </label>
                    <input
                        type="password"
                        value={passwordValue}
                        onChange={(e) => onPasswordChange(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2 text-xs text-neutral-900 focus:border-red-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                        required
                    />
                    {passwordError && (
                        <p className="text-[11px] text-red-500">{passwordError}</p>
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
                            onClick={() => onToggleConfirm(false)}
                            className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
