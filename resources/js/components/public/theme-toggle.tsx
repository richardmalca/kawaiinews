import { useAppearance } from '@/hooks/use-appearance';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');
    };

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-950 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-white ${className}`}
        >
            {!mounted ? (
                <span className="h-4 w-4" />
            ) : resolvedAppearance === 'dark' ? (
                <Sun className="h-4 w-4 rotate-0 text-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
                <Moon className="h-4 w-4 text-neutral-700 transition-transform duration-300" />
            )}
        </button>
    );
}
