import React from 'react';
import { useRadioPlayer } from '@/contexts/radio-context';
import {
    Radio,
    Play,
    Pause,
    SkipForward,
    Volume2,
    VolumeX,
    X,
    ChevronDown,
    ChevronUp,
    Music,
    Loader2,
    RadioTower,
} from 'lucide-react';
import { Link } from '@inertiajs/react';

export function PersistentRadioPlayer() {
    const {
        isPlaying,
        currentTrack,
        isDockVisible,
        isMinimized,
        isLive,
        volume,
        isMuted,
        isLoading,
        isPausedByArticle,
        togglePlay,
        nextTrack,
        toggleMute,
        setVolume,
        jumpToLive,
        setDockVisible,
        setIsMinimized,
    } = useRadioPlayer();

    if (!isDockVisible) {
        return null;
    }

    if (isMinimized) {
        return (
            <div className="fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6">
                <button
                    onClick={() => setIsMinimized(false)}
                    className="relative flex items-center gap-2 rounded-full border border-rose-500/30 bg-neutral-900/90 px-3 py-2 text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 dark:border-rose-500/40 dark:bg-black/90"
                    title="Abrir KawaiiRadio"
                >
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 text-white">
                        <Radio className="h-4 w-4" />
                        {isPlaying && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                            </span>
                        )}
                    </div>
                    <span className="max-w-[120px] truncate text-xs font-semibold">
                        {isPausedByArticle ? 'Pausa (Artículo)' : currentTrack?.title || 'KawaiiRadio'}
                    </span>
                    <ChevronUp className="h-4 w-4 text-neutral-400" />
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200/80 bg-white/95 px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] shadow-2xl backdrop-blur-lg dark:border-neutral-800/80 dark:bg-neutral-950/95 sm:px-6 sm:py-3">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100 shadow-xs dark:bg-neutral-900 sm:h-12 sm:w-12">
                        {currentTrack?.image_url ? (
                            <img
                                src={currentTrack.image_url}
                                alt={currentTrack.title}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-rose-500">
                                {currentTrack?.type === 'music' ? (
                                    <Music className="h-5 w-5" />
                                ) : (
                                    <Radio className="h-5 w-5" />
                                )}
                            </div>
                        )}

                        {isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="flex items-end gap-0.5">
                                    <span className="h-3 w-1 animate-[bounce_1s_infinite_100ms] rounded-full bg-white"></span>
                                    <span className="h-4 w-1 animate-[bounce_1s_infinite_300ms] rounded-full bg-white"></span>
                                    <span className="h-2.5 w-1 animate-[bounce_1s_infinite_200ms] rounded-full bg-white"></span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            {isLive ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                                    <span className="h-1.5 w-1.5 animate-ping rounded-full bg-rose-500"></span>
                                    EN VIVO
                                </span>
                            ) : (
                                <button
                                    onClick={jumpToLive}
                                    className="inline-flex items-center gap-1 rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-700 hover:bg-rose-500 hover:text-white dark:bg-neutral-800 dark:text-neutral-300 transition-colors"
                                    title="Volver a la transmisión en vivo sincronizada"
                                >
                                    <RadioTower className="h-2.5 w-2.5" />
                                    VOLVER A EN VIVO
                                </button>
                            )}

                            {isPausedByArticle && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                    En pausa (Artículo)
                                </span>
                            )}

                            <span className="hidden sm:inline-block text-[11px] font-medium text-neutral-400">
                                {currentTrack?.type === 'article' ? 'Noticia IA' : 'Música'}
                            </span>
                        </div>

                        {currentTrack?.article_slug ? (
                            <Link
                                href={`/noticias/${currentTrack.article_slug}`}
                                className="block truncate text-xs font-semibold text-neutral-900 hover:text-rose-500 dark:text-white dark:hover:text-rose-400 sm:text-sm"
                            >
                                {currentTrack.title}
                            </Link>
                        ) : (
                            <p className="truncate text-xs font-semibold text-neutral-900 dark:text-white sm:text-sm">
                                {currentTrack?.title || 'KawaiiRadio - Conectando...'}
                            </p>
                        )}

                        {currentTrack?.artist && (
                            <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                                {currentTrack.artist}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-3">
                    <button
                        onClick={togglePlay}
                        disabled={isLoading}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 sm:h-10 sm:w-10"
                        title={isPlaying ? 'Pausar radio' : 'Reproducir radio'}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                        ) : isPlaying ? (
                            <Pause className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                        ) : (
                            <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current ml-0.5" />
                        )}
                    </button>

                    <button
                        onClick={nextTrack}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
                        title="Siguiente pista"
                    >
                        <SkipForward className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5">
                        <button
                            onClick={toggleMute}
                            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                            title={isMuted ? 'Desactivar silencio' : 'Silenciar'}
                        >
                            {isMuted || volume === 0 ? (
                                <VolumeX className="h-4 w-4" />
                            ) : (
                                <Volume2 className="h-4 w-4" />
                            )}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="h-1.5 w-16 cursor-pointer accent-rose-500 sm:w-20"
                        />
                    </div>

                    <button
                        onClick={() => setIsMinimized(true)}
                        className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
                        title="Minimizar reproductor"
                    >
                        <ChevronDown className="h-4 w-4" />
                    </button>

                    <button
                        onClick={() => {
                            if (isPlaying) togglePlay();
                            setDockVisible(false);
                        }}
                        className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
                        title="Cerrar radio"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
