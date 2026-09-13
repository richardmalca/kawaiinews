import { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { AtSign, Eye, EyeOff, Loader2, Send, X } from 'lucide-react';
import type { FollowedUserSuggestion, PublicComment } from '@/types';
import { UserBadge } from '@/components/public/user-badge';

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
    placeholder = 'Escribe un comentario respetuoso... (puedes usar @ para mencionar a quienes sigues)',
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

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [suggestions, setSuggestions] = useState<FollowedUserSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (!showSuggestions || !isAuthenticated) {
            return;
        }

        const controller = new AbortController();
        setLoadingSuggestions(true);

        fetch(`/usuarios-seguidos/sugerencias?q=${encodeURIComponent(mentionQuery)}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then((res) => (res.ok ? res.json() : []))
            .then((data: FollowedUserSuggestion[]) => {
                setSuggestions(data);
                setSelectedIndex(0);
                setLoadingSuggestions(false);
            })
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    setSuggestions([]);
                    setLoadingSuggestions(false);
                }
            });

        return () => controller.abort();
    }, [mentionQuery, showSuggestions, isAuthenticated]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setBody(val);

        const cursorPos = e.target.selectionStart;
        const textBeforeCursor = val.slice(0, cursorPos);
        const lastAtMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\-\.]*)$/);

        if (lastAtMatch && isAuthenticated) {
            const query = lastAtMatch[1];
            const atIndex = cursorPos - lastAtMatch[0].length;
            setMentionStartIndex(atIndex);
            setMentionQuery(query);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
            setMentionStartIndex(null);
        }
    };

    const handleSelectSuggestion = (user: FollowedUserSuggestion) => {
        if (mentionStartIndex === null) {
            return;
        }

        const cursorPos = textareaRef.current?.selectionStart ?? body.length;
        const beforeAt = body.slice(0, mentionStartIndex);
        const afterCursor = body.slice(cursorPos);
        const newBody = `${beforeAt}@${user.username} ${afterCursor}`;

        setBody(newBody);
        setShowSuggestions(false);
        setMentionStartIndex(null);

        setTimeout(() => {
            if (textareaRef.current) {
                const nextPos = mentionStartIndex + user.username.length + 2;
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(nextPos, nextPos);
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!showSuggestions || suggestions.length === 0) {
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            const chosen = suggestions[selectedIndex];
            if (chosen) {
                handleSelectSuggestion(chosen);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

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
            setShowSuggestions(false);
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

            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={body}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
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

                {showSuggestions && (
                    <div className="absolute left-0 bottom-full mb-1.5 w-64 sm:w-72 max-h-52 overflow-y-auto rounded-2xl border border-neutral-200/90 bg-white/98 p-1.5 shadow-xl backdrop-blur-md z-30 dark:border-neutral-800/90 dark:bg-neutral-950/98">
                        <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800/60 mb-1">
                            <span className="flex items-center gap-1">
                                <AtSign className="h-3 w-3 text-purple-500" />
                                <span>Usuarios que sigues</span>
                            </span>
                            {loadingSuggestions && <Loader2 className="h-3 w-3 animate-spin" />}
                        </div>

                        {suggestions.length > 0 ? (
                            suggestions.map((u, index) => {
                                const isSelected = index === selectedIndex;
                                return (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleSelectSuggestion(u);
                                        }}
                                        className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors ${
                                            isSelected
                                                ? 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'
                                        }`}
                                    >
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-rose-500/10 text-[10px] font-bold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                                            {u.avatar ? (
                                                <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                                            ) : (
                                                u.name.charAt(0).toUpperCase()
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 truncate">
                                                <span className="truncate text-xs font-bold text-neutral-900 dark:text-white">
                                                    {u.name}
                                                </span>
                                                {u.badge && <UserBadge badge={u.badge} className="px-1 py-0 text-[8px]" />}
                                            </div>
                                            <span className="block text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                                                @{u.username}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-3 py-2 text-center text-xs text-neutral-400 dark:text-neutral-500">
                                {loadingSuggestions
                                    ? 'Buscando...'
                                    : mentionQuery
                                    ? `No sigues a nadie que empiece por "${mentionQuery}"`
                                    : 'Solo puedes mencionar a perfiles que sigues'}
                            </div>
                        )}
                    </div>
                )}
            </div>

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
