import { Feather, Shield, Sparkles, Star, Trophy } from 'lucide-react';
import type { CommunityBadge } from '@/types';

interface UserBadgeProps {
    badge?: CommunityBadge | null;
    className?: string;
}

export function UserBadge({ badge, className = '' }: UserBadgeProps) {
    if (!badge) {
        return null;
    }

    const badgeStyles: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
        staff: {
            bg: 'bg-rose-500/10 dark:bg-rose-500/20',
            text: 'text-rose-600 dark:text-rose-400',
            border: 'border-rose-200/80 dark:border-rose-900/60',
            icon: <Shield className="h-2.5 w-2.5 shrink-0" />,
        },
        author: {
            bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
            text: 'text-indigo-600 dark:text-indigo-400',
            border: 'border-indigo-200/80 dark:border-indigo-900/60',
            icon: <Feather className="h-2.5 w-2.5 shrink-0" />,
        },
        top_commenter: {
            bg: 'bg-amber-500/10 dark:bg-amber-500/20',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-200/80 dark:border-amber-900/60',
            icon: <Trophy className="h-2.5 w-2.5 shrink-0" />,
        },
        veteran: {
            bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-200/80 dark:border-emerald-900/60',
            icon: <Sparkles className="h-2.5 w-2.5 shrink-0" />,
        },
    };

    const style = badgeStyles[badge.key] || {
        bg: 'bg-neutral-500/10 dark:bg-neutral-500/20',
        text: 'text-neutral-600 dark:text-neutral-400',
        border: 'border-neutral-200/80 dark:border-neutral-800/80',
        icon: <Star className="h-2.5 w-2.5 shrink-0" />,
    };

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wide uppercase shadow-2xs ${style.bg} ${style.text} ${style.border} ${className}`}
        >
            {style.icon}
            <span>{badge.label}</span>
        </span>
    );
}
