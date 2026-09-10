import { Bookmark, Check, FileText, Headphones, Heart, MessageCircle, Minus, Pause, Play, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

interface ArticleMobileDockProps {
    liked: boolean;
    likersCount: number;
    favorited: boolean;
    isLiking: boolean;
    isFavoriting: boolean;
    fontSize: 'sm' | 'base' | 'lg';
    copiedText: boolean;
    commentsCount?: number;
    onToggleLike: () => void;
    onToggleFavorite: () => void;
    onCopyPlainText: () => void;
    setFontSize: Dispatch<SetStateAction<'sm' | 'base' | 'lg'>>;
}

export function ArticleMobileDock({
    liked,
    likersCount,
    favorited,
    isLiking,
    isFavoriting,
    fontSize,
    copiedText,
    commentsCount = 0,
    onToggleLike,
    onToggleFavorite,
    onCopyPlainText,
    setFontSize,
}: ArticleMobileDockProps) {
    const [audioState, setAudioState] = useState({
        isPlaying: false,
        isPaused: false,
    });

    useEffect(() => {
        const handleStatus = (e: Event) => {
            const customEvent = e as CustomEvent<{
                isPlaying: boolean;
                isPaused: boolean;
            }>;
            if (customEvent.detail) {
                setAudioState({
                    isPlaying: customEvent.detail.isPlaying,
                    isPaused: customEvent.detail.isPaused,
                });
            }
        };

        window.addEventListener('kawaii:audio-status-change', handleStatus);
        return () => window.removeEventListener('kawaii:audio-status-change', handleStatus);
    }, []);

    const handleToggleAudio = () => {
        window.dispatchEvent(new CustomEvent('kawaii:toggle-audio'));
    };

    const isAudioActive = audioState.isPlaying || audioState.isPaused;

    return (
        <div
            className={`fixed left-4 right-4 z-40 transition-all duration-300 lg:hidden ${
                isAudioActive ? 'bottom-20' : 'bottom-4'
            }`}
        >
            <div className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-2xl border border-neutral-200/80 bg-white/90 px-2.5 py-2 shadow-2xl backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-900/90">
                <button
                    type="button"
                    onClick={handleToggleAudio}
                    aria-label="Escuchar artículo"
                    className={`flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                        audioState.isPlaying
                            ? 'bg-rose-500/15 text-rose-600 dark:bg-rose-500/25 dark:text-rose-400 animate-pulse'
                            : audioState.isPaused
                              ? 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/25 dark:text-amber-400'
                              : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                    }`}
                >
                    {audioState.isPlaying ? (
                        <Pause className="h-4 w-4 fill-current text-rose-500" />
                    ) : audioState.isPaused ? (
                        <Play className="h-4 w-4 fill-current text-amber-500" />
                    ) : (
                        <Headphones className="h-4 w-4 text-rose-500" />
                    )}
                </button>

                <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800" />

                <button
                    type="button"
                    onClick={onToggleLike}
                    disabled={isLiking}
                    aria-label="Me gusta"
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                        liked
                            ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                            : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                    }`}
                >
                    <Heart
                        className={`h-4 w-4 ${liked ? 'fill-rose-500 text-rose-500 dark:fill-rose-400 dark:text-rose-400' : 'text-neutral-500 dark:text-neutral-400'}`}
                    />
                    <span>{likersCount > 0 ? likersCount : 'Gusta'}</span>
                </button>

                <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800" />

                <button
                    type="button"
                    onClick={onToggleFavorite}
                    disabled={isFavoriting}
                    aria-label="Guardar"
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                        favorited
                            ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                            : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                    }`}
                >
                    <Bookmark
                        className={`h-4 w-4 ${favorited ? 'fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400' : 'text-neutral-500 dark:text-neutral-400'}`}
                    />
                    <span>{favorited ? 'Guardado' : 'Guardar'}</span>
                </button>

                <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800" />

                <a
                    href="#comentarios"
                    aria-label="Comentarios"
                    className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-neutral-700 transition-all hover:bg-neutral-100 active:scale-95 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                    <MessageCircle className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                    <span>{commentsCount > 0 ? commentsCount : 'Opinar'}</span>
                </a>

                <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800" />

                <div className="flex items-center gap-0.5 rounded-xl bg-neutral-100/80 p-0.5 dark:bg-neutral-800/80">
                    <button
                        type="button"
                        onClick={() =>
                            setFontSize((curr) =>
                                curr === 'lg' ? 'base' : 'sm',
                            )
                        }
                        disabled={fontSize === 'sm'}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-neutral-600 hover:bg-white disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                        <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-1 text-[10px] font-bold uppercase text-neutral-700 dark:text-neutral-300">
                        {fontSize}
                    </span>
                    <button
                        type="button"
                        onClick={() =>
                            setFontSize((curr) =>
                                curr === 'sm' ? 'base' : 'lg',
                            )
                        }
                        disabled={fontSize === 'lg'}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-neutral-600 hover:bg-white disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                        <Plus className="h-3 w-3" />
                    </button>
                </div>

                <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800" />

                <button
                    type="button"
                    onClick={onCopyPlainText}
                    title="Copiar texto"
                    className="flex h-7 w-7 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                    {copiedText ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                        <FileText className="h-3.5 w-3.5 text-rose-500" />
                    )}
                </button>
            </div>
        </div>
    );
}
