import { useEffect, useState } from 'react';

export function useReadingProgress(targetSelector: string = 'article'): number {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const updateScrollProgress = () => {
            const target = document.querySelector(targetSelector);
            const currentScroll =
                window.scrollY ||
                document.documentElement.scrollTop ||
                document.body.scrollTop ||
                0;

            if (target instanceof HTMLElement) {
                const targetTop =
                    target.getBoundingClientRect().top + currentScroll;
                const targetHeight = target.offsetHeight;
                const viewportHeight = window.innerHeight;

                const startOffset = Math.max(0, targetTop - 80);
                const totalScrollable = Math.max(
                    1,
                    targetHeight - viewportHeight + 160,
                );

                if (currentScroll <= startOffset) {
                    setProgress(0);
                    return;
                }

                const scrolledIntoArticle = currentScroll - startOffset;
                const percentage = (scrolledIntoArticle / totalScrollable) * 100;

                setProgress(
                    Number(Math.min(100, Math.max(0, percentage)).toFixed(1)),
                );
                return;
            }

            const scrollHeight =
                Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight,
                ) - window.innerHeight;

            if (scrollHeight > 0) {
                const calculated = (currentScroll / scrollHeight) * 100;
                setProgress(
                    Number(Math.min(100, Math.max(0, calculated)).toFixed(1)),
                );
            }
        };

        window.addEventListener('scroll', updateScrollProgress, {
            passive: true,
        });
        window.addEventListener('resize', updateScrollProgress, {
            passive: true,
        });
        updateScrollProgress();

        return () => {
            window.removeEventListener('scroll', updateScrollProgress);
            window.removeEventListener('resize', updateScrollProgress);
        };
    }, [targetSelector]);

    return progress;
}
