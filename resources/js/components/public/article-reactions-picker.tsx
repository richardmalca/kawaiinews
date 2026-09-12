import { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { openChooseUsernameModal } from '@/lib/username-rules';

interface ArticleReactionsPickerProps {
    articleSlug: string;
}

const REACTIONS = [
    { id: 'fire', emoji: '🔥', label: 'Épico' },
    { id: 'heart', emoji: '💖', label: 'Kawaii' },
    { id: 'shock', emoji: '😱', label: 'Impactante' },
    { id: 'cry', emoji: '😢', label: 'Triste' },
    { id: 'think', emoji: '🤔', label: 'Curioso' },
] as const;

export function ArticleReactionsPicker({ articleSlug }: ArticleReactionsPickerProps) {
    const { auth } = usePage().props;
    const isAuthenticated = Boolean(auth.user);
    const hasUsername = Boolean(auth.user?.username);

    const storageKey = `kawaii_rx_${articleSlug}`;
    const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
    const [counts, setCounts] = useState<Record<string, number>>({
        fire: 12,
        heart: 18,
        shock: 7,
        cry: 3,
        think: 9,
    });

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            setSelectedReaction(saved);
        }
    }, [storageKey]);

    const handleReact = (id: string) => {
        if (!isAuthenticated) {
            router.visit('/login');
            return;
        }

        if (!hasUsername) {
            openChooseUsernameModal();
            return;
        }

        if (selectedReaction === id) {
            setSelectedReaction(null);
            localStorage.removeItem(storageKey);
            setCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 1) - 1) }));
            toast('Reacción retirada');
            return;
        }

        const prev = selectedReaction;
        setSelectedReaction(id);
        localStorage.setItem(storageKey, id);

        setCounts((old) => {
            const next = { ...old, [id]: (old[id] || 0) + 1 };
            if (prev) {
                next[prev] = Math.max(0, (next[prev] || 1) - 1);
            }
            return next;
        });

        const reactionObj = REACTIONS.find((r) => r.id === id);
        toast.success(`Reaccionaste: ${reactionObj?.label || ''} ${reactionObj?.emoji || ''}`);
    };

    return (
        <div className="rounded-3xl border border-neutral-200/80 bg-white/70 p-4 shadow-xs backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/50">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    ¿Qué te pareció esta noticia?
                </span>
                <span className="text-[11px] text-neutral-400">Reacciones rápidas</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
                {REACTIONS.map((rx) => {
                    const isSelected = selectedReaction === rx.id;
                    const count = counts[rx.id] || 0;

                    return (
                        <button
                            key={rx.id}
                            type="button"
                            onClick={() => handleReact(rx.id)}
                            className={`group flex flex-1 min-w-[56px] flex-col items-center justify-center rounded-2xl p-2 transition-all duration-200 active:scale-95 ${
                                isSelected
                                    ? 'bg-rose-500/15 ring-2 ring-rose-500 dark:bg-rose-500/25'
                                    : 'border border-neutral-100 bg-neutral-50/60 hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-800/60 dark:bg-neutral-850 dark:hover:border-neutral-700'
                            }`}
                        >
                            <span className="text-xl transition-transform duration-200 group-hover:scale-125">
                                {rx.emoji}
                            </span>
                            <span className="mt-1 text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
