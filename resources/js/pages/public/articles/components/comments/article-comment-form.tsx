import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Eye, EyeOff, Loader2, Send, X } from 'lucide-react';
import type { PublicComment } from '@/types';

interface ArticleCommentFormProps {
    placeholder?: string;
    replyingTo?: PublicComment | null;
    isSubmitting?: boolean;
    autoFocus?: boolean;
    onCancelReply?: () => void;
    onSubmit: (data: { body: string; replyToCommentId?: number | null; isSpoiler: boolean }) => Promise<boolean>;
    onRequireAuth?: () => void;
}

export function ArticleCommentForm({
    placeholder = 'Escribe un comentario respetuoso...',
    replyingTo,
    isSubmitting = false,
    autoFocus = false,
    onCancelReply,
    onSubmit,
    onRequireAuth,
}: ArticleCommentFormProps) {
    const { auth } = usePage().props;
    const isAuthenticated = Boolean(auth.user);
    const [body, setBody] = useState('');
    const [isSpoiler, setIsSpoiler] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            onRequireAuth?.();
            return;
        }

        if (!body.trim() || isSubmitting) {
            return;
        }

        const success = await onSubmit({
            body: body.trim(),
            replyToCommentId: replyingTo?.id,
            isSpoiler,
        });

        if (success) {
            setBody('');
            setIsSpoiler(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative rounded-xl sm:rounded-2xl border border-neutral-200/80 bg-white p-2.5 sm:p-4 shadow-2xs transition-all focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-500/10 dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:focus-within:border-rose-800/60">
            {replyingTo && (
                <div className="mb-2 flex items-center justify-between rounded-lg sm:rounded-xl bg-rose-50/70 px-2.5 py-1 text-[11px] sm:text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold">Respondiendo a</span>
                        <span className="font-bold">@{replyingTo.user?.username ?? replyingTo.user?.name ?? 'usuario'}</span>
                    </div>
                    {onCancelReply && (
                        <button
                            type="button"
                            onClick={onCancelReply}
                            className="ml-2 inline-flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-md text-rose-500 hover:bg-rose-200/50 dark:hover:bg-rose-900/50"
                            title="Cancelar respuesta"
                        >
                            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </button>
                    )}
                </div>
            )}

            <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={!isAuthenticated ? 'Inicia sesión para dejar un comentario...' : placeholder}
                rows={replyingTo ? 2 : 2}
                maxLength={2000}
                autoFocus={autoFocus}
                onFocus={() => {
                    if (!isAuthenticated) {
                        onRequireAuth?.();
                    }
                }}
                className="w-full resize-none bg-transparent text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden sm:text-sm dark:text-neutral-100 dark:placeholder:text-neutral-500"
            />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 border-t border-neutral-100 pt-2 sm:pt-2.5 dark:border-neutral-800/60">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                        type="button"
                        onClick={() => setIsSpoiler(!isSpoiler)}
                        className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 text-[11px] sm:text-xs font-medium transition-colors ${
                            isSpoiler
                                ? 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                                : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
                        }`}
                        title="Marcar contenido como spoiler"
                    >
                        {isSpoiler ? (
                            <>
                                <EyeOff className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600 dark:text-amber-400" />
                                <span className="font-semibold">Spoiler</span>
                            </>
                        ) : (
                            <>
                                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span>Spoiler</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                    {replyingTo && onCancelReply && (
                        <button
                            type="button"
                            onClick={onCancelReply}
                            className="rounded-lg sm:rounded-xl px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800"
                        >
                            Cancelar
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || (!body.trim() && isAuthenticated)}
                        className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs font-bold text-white shadow-xs transition-transform hover:from-rose-600 hover:to-pink-600 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                        ) : (
                            <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        )}
                        <span>{replyingTo ? 'Responder' : 'Comentar'}</span>
                    </button>
                </div>
            </div>
        </form>
    );
}
