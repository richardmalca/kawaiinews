import { useReadingProgress } from '@/hooks/use-reading-progress';

export function ReadingProgressBar() {
    const progress = useReadingProgress();

    if (progress <= 0) {
        return null;
    }

    return (
        <div className="fixed top-16 right-0 left-0 z-40 h-1 bg-neutral-200/40 dark:bg-neutral-800/40">
            <div
                className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
