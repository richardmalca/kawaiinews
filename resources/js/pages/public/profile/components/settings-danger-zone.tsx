import { AlertTriangle, BookOpen, CheckCircle2, Heart, MessageSquare, ShieldAlert, Sparkles, Trash2, UserX } from 'lucide-react';
import {
    AlertDialog,
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
    username: string;
    hasGoogleAuth: boolean;
    authoredArticlesCount?: number;
    inputValue: string;
    inputError?: string;
    onToggleConfirm: (val: boolean) => void;
    onInputChange: (val: string) => void;
    onDeleteSubmit: (e: React.FormEvent) => void;
}

export function SettingsDangerZone({
    deleteConfirm,
    deleting,
    username,
    hasGoogleAuth,
    authoredArticlesCount = 0,
    inputValue,
    inputError,
    onToggleConfirm,
    onInputChange,
    onDeleteSubmit,
}: SettingsDangerZoneProps) {
    const isReadyToSubmit = hasGoogleAuth
        ? inputValue.trim() === username
        : inputValue.trim().length > 0;

    return (
        <div className="overflow-hidden rounded-3xl border border-red-200/70 bg-gradient-to-br from-red-50/40 via-white to-white p-6 shadow-xs sm:p-8 dark:border-red-900/30 dark:from-red-950/10 dark:via-neutral-900/70 dark:to-neutral-900/50 dark:shadow-none">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                            <ShieldAlert className="h-3.5 w-3.5" />
                        </div>
                        <h2 className="text-sm font-bold tracking-tight text-red-600 dark:text-red-400">
                            Zona de peligro: Eliminar cuenta
                        </h2>
                    </div>
                    <p className="max-w-xl text-xs text-neutral-600 dark:text-neutral-400">
                        Una vez eliminada tu cuenta, no podrás recuperar tu perfil, lista de favoritos, votos ni interacciones guardadas. Esta operación es permanente e irreversible.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => onToggleConfirm(true)}
                    className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-red-300 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 transition-all hover:border-red-400 hover:bg-red-100 hover:shadow-xs dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                >
                    <Trash2 className="h-4 w-4" />
                    <span>Eliminar mi cuenta</span>
                </button>
            </div>

            <AlertDialog open={deleteConfirm} onOpenChange={onToggleConfirm}>
                <AlertDialogContent className="flex max-h-[85vh] w-[95vw] !max-w-4xl flex-col overflow-hidden rounded-3xl border-neutral-200/90 bg-white/98 p-0 shadow-2xl backdrop-blur-2xl dark:border-neutral-800/90 dark:bg-neutral-900/98 data-[size=default]:!max-w-4xl data-[size=default]:sm:!max-w-4xl">
                    <form onSubmit={onDeleteSubmit} className="flex max-h-[85vh] flex-col">
                        {/* Modal Header (Fixed) */}
                        <div className="border-b border-neutral-100 px-6 py-5 sm:px-8 dark:border-neutral-800/60">
                            <AlertDialogHeader className="text-left sm:text-left">
                                <div className="flex items-center gap-3.5">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                                        <Trash2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <AlertDialogTitle className="text-base font-bold text-neutral-900 sm:text-lg dark:text-white">
                                            ¿Eliminar tu cuenta definitivamente?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                            Esta acción es irreversible y no se puede deshacer una vez confirmada.
                                        </AlertDialogDescription>
                                    </div>
                                </div>
                            </AlertDialogHeader>
                        </div>

                        {/* Scrollable Content Body */}
                        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 sm:px-8">
                            {/* Breakdown of what is deleted */}
                            <div className="space-y-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-4 sm:p-5 dark:border-neutral-800/80 dark:bg-neutral-950/40">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    Información e interacciones que se borrarán:
                                </p>
                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                    <div className="flex items-start gap-2.5 rounded-xl bg-white/60 p-2.5 text-xs text-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300">
                                        <UserX className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                                        <span>Tu perfil público, avatar, banner y nombre de usuario (<strong>@{username}</strong>).</span>
                                    </div>
                                    <div className="flex items-start gap-2.5 rounded-xl bg-white/60 p-2.5 text-xs text-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300">
                                        <Heart className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                                        <span>Tu lista privada de noticias guardadas en favoritos y todos tus "me gusta".</span>
                                    </div>
                                    <div className="flex items-start gap-2.5 rounded-xl bg-white/60 p-2.5 text-xs text-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300">
                                        <MessageSquare className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                                        <span>Tus comentarios, réplicas e historial de votos comunitarios.</span>
                                    </div>
                                    <div className="flex items-start gap-2.5 rounded-xl bg-white/60 p-2.5 text-xs text-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300">
                                        <Sparkles className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                                        <span>Categorías, etiquetas y autores que sigues, además de tus notificaciones.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Special editorial policy alert for published articles */}
                            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 sm:p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
                                <div className="flex items-start gap-3">
                                    <BookOpen className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                                    <div className="space-y-1 text-xs text-amber-800 dark:text-amber-300">
                                        <p className="font-semibold">
                                            {authoredArticlesCount > 0
                                                ? `Tienes ${authoredArticlesCount} ${authoredArticlesCount === 1 ? 'noticia publicada' : 'noticias publicadas'}`
                                                : 'Publicaciones y contenido informativo'}
                                        </p>
                                        <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400/90">
                                            Las noticias o artículos que hayas redactado y que hayan sido aprobados en KawaiiNews pasarán automáticamente a estado de borrador o moderación editorial para ser reescritos y preservados por nuestro equipo, conservando la licencia editorial de difusión estipulada en los Términos de Servicio.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Confirmation field: Username for Google login, Password for standard login */}
                            <div className="space-y-2 rounded-2xl border border-neutral-200/60 bg-neutral-50/40 p-4 dark:border-neutral-800/60 dark:bg-neutral-950/20">
                                {hasGoogleAuth ? (
                                    <>
                                        <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                            Para confirmar, escribe tu nombre de usuario exacto:{' '}
                                            <span className="select-all rounded-md bg-neutral-200/70 px-1.5 py-0.5 font-mono text-[11px] text-neutral-900 dark:bg-neutral-800 dark:text-white">
                                                {username}
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => onInputChange(e.target.value)}
                                            placeholder={username}
                                            className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 font-mono text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-red-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
                                            required
                                            autoFocus
                                        />
                                    </>
                                ) : (
                                    <>
                                        <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                            Ingresa tu contraseña actual para confirmar:
                                        </label>
                                        <input
                                            type="password"
                                            value={inputValue}
                                            onChange={(e) => onInputChange(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 focus:border-red-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800 dark:text-white"
                                            required
                                            autoFocus
                                        />
                                    </>
                                )}
                                {inputError && (
                                    <p className="text-[11px] font-medium text-red-500">{inputError}</p>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer (Fixed) */}
                        <div className="border-t border-neutral-100 bg-neutral-50/50 px-6 py-4 sm:px-8 dark:border-neutral-800/60 dark:bg-neutral-950/40">
                            <AlertDialogFooter className="flex-row items-center justify-end gap-2.5">
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
                                    disabled={deleting || !isReadyToSubmit}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700"
                                >
                                    {deleting ? 'Eliminando cuenta...' : 'Sí, eliminar cuenta'}
                                </button>
                            </AlertDialogFooter>
                        </div>
                    </form>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
