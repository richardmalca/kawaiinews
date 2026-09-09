export function NewsCardSkeleton() {
    return (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs dark:border-neutral-800/80 dark:bg-neutral-900/40">
            <div className="h-48 w-full animate-pulse bg-neutral-200 dark:bg-neutral-800" />
            <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                        <div className="h-3 w-12 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                    </div>
                    <div className="h-5 w-4/5 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-3 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                </div>
                <div className="border-t border-neutral-100 pt-3 dark:border-neutral-800/60">
                    <div className="h-3 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                </div>
            </div>
        </div>
    );
}
