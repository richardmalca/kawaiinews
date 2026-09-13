import { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { openChooseUsernameModal } from '@/lib/username-rules';
import { readCsrfToken } from '@/pages/public/profile/lib/profile-utils';

interface ArticleReactionsPickerProps {
    articleSlug: string;
    initialReactions?: Record<string, number>;
    initialUserReaction?: string | null;
}

const REACTIONS = [
    { id: 'fire', emoji: '🔥', label: 'Épico' },
    { id: 'heart', emoji: '💖', label: 'Kawaii' },
    { id: 'shock', emoji: '😱', label: 'Impactante' },
    { id: 'cry', emoji: '😢', label: 'Triste' },
    { id: 'think', emoji: '🤔', label: 'Curioso' },
] as const;

export function ArticleReactionsPicker({
    articleSlug,
    initialReactions,
    initialUserReaction = null,
}: ArticleReactionsPickerProps) {
    const { auth } = usePage().props;
    const isAuthenticated = Boolean(auth.user);
    const hasUsername = Boolean(auth.user?.username);

    const [selectedReaction, setSelectedReaction] = useState<string | null>(initialUserReaction);
    const [counts, setCounts] = useState<Record<string, number>>({
        fire: initialReactions?.fire ?? 0,
        heart: initialReactions?.heart ?? 0,
        shock: initialReactions?.shock ?? 0,
        cry: initialReactions?.cry ?? 0,
        think: initialReactions?.think ?? 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReact = async (id: string) => {
        if (!isAuthenticated) {
            router.visit('/login');
            return;
        }

        if (!hasUsername) {
            openChooseUsernameModal();
            return;
        }

        if (isSubmitting) return;

        const prevReaction = selectedReaction;
        const prevCounts = { ...counts };

        let nextReaction: string | null = null;
        const nextCounts = { ...counts };

        if (prevReaction === id) {
            nextReaction = null;
            nextCounts[id] = Math.max(0, (nextCounts[id] || 1) - 1);
        } else {
            nextReaction = id;
            nextCounts[id] = (nextCounts[id] || 0) + 1;
            if (prevReaction) {
                nextCounts[prevReaction] = Math.max(0, (nextCounts[prevReaction] || 1) - 1);
            }
        }

        setSelectedReaction(nextReaction);
        setCounts(nextCounts);
        setIsSubmitting(true);

        const reactionObj = REACTIONS.find((r) => r.id === id);

        try {
            const res = await fetch(`/noticias/${articleSlug}/reaccionar`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({ reaction: id }),
            });

            if (!res.ok) {
                setSelectedReaction(prevReaction);
                setCounts(prevCounts);
                toast.error('No se pudo guardar la reacción');
                return;
            }

            const data = (await res.json()) as {
                reaction: string | null;
                reactions: Record<string, number>;
            };

            setSelectedReaction(data.reaction);
            setCounts((current) => ({ ...current, ...data.reactions }));

            if (data.reaction) {
                toast.success(`Reaccionaste: ${reactionObj?.label || ''} ${reactionObj?.emoji || ''}`);
            } else {
                toast('Reacción retirada');
            }
        } catch {
            setSelectedReaction(prevReaction);
            setCounts(prevCounts);
            toast.error('Error de conexión al enviar reacción');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-800/80 dark:bg-neutral-900/40">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    ¿Qué te pareció esta noticia?
                </span>
                <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">Reacciones rápidas</span>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {REACTIONS.map((rx) => {
                    const isSelected = selectedReaction === rx.id;
                    const count = counts[rx.id] || 0;

                    return (
                        <button
                            key={rx.id}
                            type="button"
                            onClick={() => handleReact(rx.id)}
                            title={rx.label}
                            className={`group relative flex flex-col items-center justify-center rounded-xl py-2 px-1.5 transition-all duration-200 active:scale-95 ${
                                isSelected
                                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-600 shadow-xs dark:bg-rose-500/20 dark:border-rose-500/40 dark:text-rose-400'
                                    : 'border border-neutral-200/80 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/60 dark:hover:border-neutral-700 dark:hover:bg-neutral-800'
                            }`}
                        >
                            <span className="text-xl sm:text-2xl transition-transform duration-200 group-hover:scale-115">
                                {rx.emoji}
                            </span>
                            <span className={`mt-1 text-[11px] font-bold ${
                                isSelected
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-neutral-600 dark:text-neutral-400'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
