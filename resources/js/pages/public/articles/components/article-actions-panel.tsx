import { Bookmark, Check, FileText, Headphones, Heart, MessageCircle, Minus, Pause, Play, Plus, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

interface ArticleActionsPanelProps {
    liked: boolean;
    likersCount: number;
    favorited: boolean;
    isLiking: boolean;
    isFavoriting: boolean;
    fontSize: 'sm' | 'base' | 'lg';
    copiedText: boolean;
    sharesCount: number;
    commentsCount?: number;
    visible?: boolean;
    onToggleLike: () => void;
    onToggleFavorite: () => void;
    onCopyPlainText: () => void;
    setFontSize: Dispatch<SetStateAction<'sm' | 'base' | 'lg'>>;
}

export function ArticleActionsPanel({
    liked,
    likersCount,
    favorited,
    isLiking,
    isFavoriting,
    fontSize,
    copiedText,
    sharesCount,
    commentsCount = 0,
    visible = true,
    onToggleLike,
    onToggleFavorite,
    onCopyPlainText,
    setFontSize,
}: ArticleActionsPanelProps) {
    const [audioState, setAudioState] = useState({
        isPlaying: false,
        isPaused: false,
        isInteracting: false,
        totalSeconds: 0,
    });

    useEffect(() => {
        const handleStatus = (e: Event) => {
            const customEvent = e as CustomEvent<{
                isPlaying: boolean;
                isPaused: boolean;
                isInteracting: boolean;
                totalSeconds?: number;
            }>;
            if (customEvent.detail) {
                setAudioState({
                    isPlaying: customEvent.detail.isPlaying,
                    isPaused: customEvent.detail.isPaused,
                    isInteracting: customEvent.detail.isInteracting,
                    totalSeconds: customEvent.detail.totalSeconds ?? 0,
                });
            }
        };

        window.addEventListener('kawaii:audio-status-change', handleStatus);
        return () => window.removeEventListener('kawaii:audio-status-change', handleStatus);
    }, []);

    const handleToggleAudio = () => {
        window.dispatchEvent(new CustomEvent('kawaii:toggle-audio'));
    };

    return (
        <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
                visible
                    ? 'max-h-96 opacity-100 mb-6 translate-y-0'
                    : 'max-h-0 opacity-0 mb-0 -translate-y-2 pointer-events-none'
            }`}
        >
            <div className="rounded-3xl border border-neutral-200/80 bg-white/80 p-4 shadow-xs backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:shadow-none">
            <div className="mb-3 flex items-center justify-between border-b border-neutral-100 pb-2.5 dark:border-neutral-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Acciones de lectura
                </span>
                {sharesCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                        <Share2 className="h-3 w-3 text-rose-500" />
                        <span>{sharesCount} compartidos</span>
                    </span>
                )}
            </div>

            <div className="mb-2">
                <button
                    type="button"
                    onClick={handleToggleAudio}
                    className={`flex w-full items-center justify-between rounded-2xl border p-2.5 px-3 text-xs font-semibold transition-all active:scale-[0.98] ${
                        audioState.isPlaying
                            ? 'border-rose-500/50 bg-rose-500/10 text-rose-600 shadow-xs dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-400'
                            : audioState.isPaused
                              ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400'
                              : 'border-neutral-200 bg-neutral-100/70 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-200/60 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-800'
                    }`}
                >
                    <span className="inline-flex items-center gap-2">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            audioState.isPlaying
                                ? 'bg-rose-500 text-white animate-pulse'
                                : 'bg-rose-500/15 text-rose-600 dark:bg-rose-500/25 dark:text-rose-400'
                        }`}>
                            {audioState.isPlaying ? (
                                <Pause className="h-3 w-3 fill-current" />
                            ) : (
                                <Play className="h-3 w-3 translate-x-0.5 fill-current" />
                            )}
                        </span>
                        <span>
                            {audioState.isPlaying
                                ? 'Pausar audio'
                                : audioState.isPaused
                                  ? 'Reanudar audio'
                                  : audioState.totalSeconds > 0
                                    ? `Escuchar (${Math.max(1, Math.ceil(audioState.totalSeconds / 60))} min)`
                                    : 'Escuchar artículo'}
                        </span>
                    </span>

                    <Headphones className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={onToggleLike}
                    disabled={isLiking}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all active:scale-95 ${
                        liked
                            ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 shadow-xs dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-400'
                            : 'border-neutral-200 bg-neutral-100/70 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-200/60 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-800'
                    }`}
                >
                    <Heart
                        className={`h-4 w-4 ${liked ? 'fill-rose-500 text-rose-500 dark:fill-rose-400 dark:text-rose-400' : 'text-neutral-500 dark:text-neutral-400'}`}
                    />
                    <span>{likersCount > 0 ? `${likersCount} Me gusta` : 'Me gusta'}</span>
                </button>

                <button
                    type="button"
                    onClick={onToggleFavorite}
                    disabled={isFavoriting}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all active:scale-95 ${
                        favorited
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 shadow-xs dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400'
                            : 'border-neutral-200 bg-neutral-100/70 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-200/60 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-800'
                    }`}
                >
                    <Bookmark
                        className={`h-4 w-4 ${favorited ? 'fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400' : 'text-neutral-500 dark:text-neutral-400'}`}
                    />
                    <span>{favorited ? 'Guardado' : 'Guardar'}</span>
                </button>
            </div>

            <div className="mt-2">
                <a
                    href="#comentarios"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-100/70 p-2 text-xs font-semibold text-neutral-700 transition-all hover:border-neutral-300 hover:bg-neutral-200/60 active:scale-95 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-800"
                >
                    <MessageCircle className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                    <span>
                        {commentsCount > 0
                            ? `${commentsCount} ${commentsCount === 1 ? 'Comentario' : 'Comentarios'}`
                            : 'Comentarios'}
                    </span>
                </a>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-neutral-100 pt-2.5 dark:border-neutral-800">
                <div className="flex items-center gap-1">
                    <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                        Letra:
                    </span>
                    <div className="flex items-center gap-1 rounded-xl border border-neutral-200/80 bg-neutral-100/70 p-0.5 dark:border-neutral-800/80 dark:bg-neutral-800/60">
                        <button
                            type="button"
                            onClick={() =>
                                setFontSize((curr) =>
                                    curr === 'lg' ? 'base' : 'sm',
                                )
                            }
                            disabled={fontSize === 'sm'}
                            title="Reducir letra"
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-white hover:text-neutral-950 disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white"
                        >
                            <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-1.5 font-mono text-[10px] font-bold text-neutral-700 uppercase dark:text-neutral-300">
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
                            title="Aumentar letra"
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-white hover:text-neutral-950 disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white"
                        >
                            <Plus className="h-3 w-3" />
                        </button>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onCopyPlainText}
                    title="Copiar texto de la noticia"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200/80 bg-neutral-100/70 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                    {copiedText ? (
                        <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copiado</span>
                        </>
                    ) : (
                        <>
                            <FileText className="h-3.5 w-3.5 text-rose-500" />
                            <span>Copiar</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    </div>
    );
}
