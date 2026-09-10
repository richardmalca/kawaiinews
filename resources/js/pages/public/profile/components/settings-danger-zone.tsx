import { Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

                <button
                    type="button"
                    onClick={() => onToggleConfirm(true)}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Eliminar cuenta</span>
                </button>
            </div>

            <AlertDialog open={deleteConfirm} onOpenChange={onToggleConfirm}>
                <AlertDialogContent className="max-w-md rounded-3xl border-neutral-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-900/95">
                    <form onSubmit={onDeleteSubmit}>
                        <AlertDialogHeader>
                            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                                <Trash2 className="h-5 w-5" />
                            </div>
                            <AlertDialogTitle className="text-center text-base font-bold text-neutral-900 dark:text-white">
                                ¿Estás seguro de eliminar tu cuenta?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-center text-xs text-neutral-500 dark:text-neutral-400">
                                Esta acción es permanente y no se puede deshacer. Por favor confirma tu contraseña actual para continuar:
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="my-4 space-y-2">
                            <input
                                type="password"
                                value={passwordValue}
                                onChange={(e) => onPasswordChange(e.target.value)}
                                placeholder="••••••••"
                                className="w-full rounded-xl border border-neutral-200 bg-neutral-50/70 px-3.5 py-2.5 text-xs text-neutral-900 focus:border-red-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800 dark:text-white"
                                required
                                autoFocus
                            />
                            {passwordError && (
                                <p className="text-[11px] font-medium text-red-500">{passwordError}</p>
                            )}
                        </div>

                        <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel
                                type="button"
                                disabled={deleting}
                                onClick={() => onToggleConfirm(false)}
                                className="rounded-xl border-neutral-200 text-xs font-semibold hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
                            >
                                Cancelar
                            </AlertDialogCancel>
                            <button
                                type="submit"
                                disabled={deleting}
                                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {deleting ? 'Eliminando...' : 'Sí, eliminar cuenta'}
                            </button>
                        </AlertDialogFooter>
                    </form>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
