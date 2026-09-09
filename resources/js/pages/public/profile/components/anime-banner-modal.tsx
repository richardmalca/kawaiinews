import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Check, Sparkles } from 'lucide-react';
import { ANIME_BANNER_PRESETS, type AnimeBannerPreset } from '../lib/profile-utils';

interface AnimeBannerModalProps {
    open: boolean;
    currentBannerUrl: string | null;
    onOpenChange: (open: boolean) => void;
    onSelectBanner: (url: string) => void;
}

export function AnimeBannerModal({
    open,
    currentBannerUrl,
    onOpenChange,
    onSelectBanner,
}: AnimeBannerModalProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

    const categories = ['Todos', ...new Set(ANIME_BANNER_PRESETS.map((p) => p.category))];

    const filteredPresets =
        selectedCategory === 'Todos'
            ? ANIME_BANNER_PRESETS
            : ANIME_BANNER_PRESETS.filter((p) => p.category === selectedCategory);

    const handlePick = (preset: AnimeBannerPreset) => {
        onSelectBanner(preset.url);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[90vh] overflow-hidden rounded-3xl border border-neutral-200/80 bg-white p-0 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
                <div className="border-b border-neutral-100 p-6 sm:px-8 sm:py-6 dark:border-neutral-800">
                    <DialogHeader>
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <DialogTitle className="text-xl font-black text-neutral-950 sm:text-2xl dark:text-white">
                                Fondos Temáticos
                            </DialogTitle>
                        </div>
                        <DialogDescription className="mt-1 text-xs text-neutral-500 sm:text-sm dark:text-neutral-400">
                            Portadas panorámicas con resolución nativa 3:1 adaptadas a tu perfil.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                        {categories.map((cat) => {
                            const isActive = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                        isActive
                                            ? 'bg-rose-600 text-white shadow-xs dark:bg-rose-500'
                                            : 'bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-750'
                                    }`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="max-h-[65vh] overflow-y-auto p-6 sm:p-8">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredPresets.map((preset) => {
                            const isSelected = currentBannerUrl === preset.url;
                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => handlePick(preset)}
                                    className={`group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-150 hover:shadow-lg active:scale-[0.98] ${
                                        isSelected
                                            ? 'border-rose-500 ring-2 ring-rose-500/50 shadow-md'
                                            : 'border-neutral-200/90 hover:border-rose-300 dark:border-neutral-800 dark:hover:border-neutral-700'
                                    }`}
                                >
                                    <div className="relative h-32 w-full overflow-hidden bg-neutral-900 sm:h-36">
                                        <img
                                            src={preset.preview}
                                            alt={preset.title}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            loading="eager"
                                            decoding="async"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                                        {isSelected && (
                                            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
                                                <Check className="h-3 w-3" />
                                                <span>Seleccionado</span>
                                            </div>
                                        )}

                                        <div className="absolute right-3.5 bottom-3 left-3.5">
                                            <span className="text-[10px] font-bold tracking-wide text-rose-300 uppercase">
                                                {preset.category}
                                            </span>
                                            <h4 className="truncate text-sm font-bold text-white">
                                                {preset.title}
                                            </h4>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
