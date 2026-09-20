import { useSpeechNarrator } from '@/hooks/use-speech-narrator';
import { useRadioPlayer } from '@/contexts/radio-context';
import {
    AlertCircle,
    ArrowUp,
    FastForward,
    Headphones,
    Loader2,
    Mic,
    Pause,
    Play,
    RotateCcw,
    Sparkles,
    Volume2,
    X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface ArticleAudioPlayerProps {
    title: string;
    body: string | null;
    audioUrl?: string | null;
    onProgressChange?: (progressPercent: number, isPlaying: boolean) => void;
}

const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 1.75];

export function ArticleAudioPlayer({
    title,
    body,
    audioUrl,
    onProgressChange,
}: ArticleAudioPlayerProps) {
    const { notifyArticleAudioPlaying, notifyArticleAudioStopped } = useRadioPlayer();
    const textToRead = `${title}. ${body ?? ''}`;
    const speech = useSpeechNarrator(textToRead);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const progressBarRef = useRef<HTMLDivElement | null>(null);
    const isDraggingRef = useRef(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [speedIndex, setSpeedIndex] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const isDismissedRef = useRef(false);

    const isAiAudio = Boolean(audioUrl && !hasError);

    useEffect(() => {
        setIsPlaying(false);
        setIsPaused(false);
        setIsDismissed(false);
        isDismissedRef.current = false;
        setCurrentTime(0);
        setDuration(0);
        setHasError(false);
        setIsLoading(false);
    }, [audioUrl]);

    const handlePlayPause = () => {
        setIsDismissed(false);
        isDismissedRef.current = false;
        if (isAiAudio && audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                speech.stop();
                setIsLoading(true);
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            setIsLoading(false);
                            setIsPlaying(true);
                            setIsPaused(false);
                        })
                        .catch(() => {
                            setIsLoading(false);
                            setHasError(true);
                            speech.play();
                        });
                }
            }
            return;
        }

        if (speech.isPlaying) {
            speech.pause();
        } else {
            speech.play();
        }
    };

    const handleRestart = () => {
        setIsDismissed(false);
        isDismissedRef.current = false;
        if (isAiAudio && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
            setIsPlaying(true);
            setIsPaused(false);
            return;
        }

        speech.stop();
        speech.play();
    };

    const handleSkip = (seconds: number) => {
        if (isAiAudio && audioRef.current && duration > 0) {
            const nextTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
            audioRef.current.currentTime = nextTime;
            setCurrentTime(nextTime);
        }
    };

    const seekToClientX = (clientX: number) => {
        if (!progressBarRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        if (rect.width <= 0) return;
        const clampedX = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const percent = (clampedX / rect.width) * 100;

        if (isAiAudio && audioRef.current && duration > 0) {
            const newTime = (percent / 100) * duration;
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isAiAudio || duration <= 0) return;
        isDraggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        seekToClientX(e.clientX);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return;
        seekToClientX(e.clientX);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {}
    };

    const handleClosePlayer = () => {
        isDismissedRef.current = true;
        setIsDismissed(true);
        if (isAiAudio && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
            setIsPaused(false);
        }
        speech.stop();
        notifyArticleAudioStopped();
        window.dispatchEvent(
            new CustomEvent('kawaii:audio-status-change', {
                detail: {
                    isPlaying: false,
                    isPaused: false,
                    isInteracting: false,
                    totalSeconds: isAiAudio ? duration : speech.estimatedTotalSeconds,
                },
            }),
        );
    };

    const handleCycleSpeed = () => {
        const nextIndex = (speedIndex + 1) % PLAYBACK_SPEEDS.length;
        setSpeedIndex(nextIndex);
        const rate = PLAYBACK_SPEEDS[nextIndex];
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
        }
    };

    const activePlaying = isAiAudio ? isPlaying : speech.isPlaying;
    const activePaused = isAiAudio ? isPaused : speech.isPaused;
    const isInteracting = !isDismissed && (activePlaying || activePaused);

    const currentSeconds = isAiAudio ? currentTime : speech.elapsedSeconds;
    const totalSeconds = isAiAudio ? duration : speech.estimatedTotalSeconds;

    const formatTime = (secs: number) => {
        if (!Number.isFinite(secs) || secs <= 0) {
            return '0:00';
        }
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const progressPercent = isAiAudio
        ? duration > 0
            ? Math.min(100, (currentTime / duration) * 100)
            : 0
        : speech.progress;

    useEffect(() => {
        if (onProgressChange) {
            onProgressChange(progressPercent, activePlaying);
        }
        window.dispatchEvent(
            new CustomEvent('kawaii:audio-status-change', {
                detail: {
                    isPlaying: activePlaying,
                    isPaused: activePaused,
                    isInteracting,
                    totalSeconds,
                },
            }),
        );
    }, [progressPercent, activePlaying, activePaused, isInteracting, totalSeconds, onProgressChange]);

    useEffect(() => {
        const handleCustomToggle = () => {
            handlePlayPause();
        };

        const handleForceStop = () => {
            handleClosePlayer();
        };

        window.addEventListener('kawaii:toggle-audio', handleCustomToggle);
        window.addEventListener('kawaii:stop-article-audio', handleForceStop);
        return () => {
            window.removeEventListener('kawaii:toggle-audio', handleCustomToggle);
            window.removeEventListener('kawaii:stop-article-audio', handleForceStop);
        };
    }, [handlePlayPause, handleClosePlayer]);

    if (!audioUrl && !speech.isSupported) {
        return null;
    }

    return (
        <div ref={containerRef} className="inline-flex items-center">
            {audioUrl && !hasError && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    preload="metadata"
                    onLoadedMetadata={(e) => {
                        const d = e.currentTarget.duration;
                        if (Number.isFinite(d) && d > 0) {
                            setDuration(d);
                        }
                    }}
                    onTimeUpdate={(e) => {
                        if (!isDraggingRef.current) {
                            setCurrentTime(e.currentTarget.currentTime);
                        }
                    }}
                    onPlay={() => {
                        setIsPlaying(true);
                        setIsPaused(false);
                        setIsLoading(false);
                        notifyArticleAudioPlaying();
                    }}
                    onPause={() => {
                        setIsPlaying(false);
                        if (!isDismissedRef.current) {
                            setIsPaused(true);
                        }
                        setIsLoading(false);
                    }}
                    onEnded={() => {
                        setIsPlaying(false);
                        setIsPaused(false);
                        setCurrentTime(0);
                        notifyArticleAudioStopped();
                    }}
                    onError={() => {
                        setHasError(true);
                        setIsPlaying(false);
                        setIsPaused(false);
                        setIsLoading(false);
                        notifyArticleAudioStopped();
                    }}
                    onWaiting={() => setIsLoading(true)}
                    onCanPlay={() => setIsLoading(false)}
                />
            )}

            <div className="flex flex-wrap items-center gap-3">
                <button
                    id="article-audio-trigger"
                    type="button"
                    onClick={handlePlayPause}
                    disabled={isLoading}
                    className="group inline-flex items-center gap-2 rounded-full border border-neutral-200/90 bg-white/80 py-1 pr-3.5 pl-1.5 shadow-2xs backdrop-blur-xs transition-all hover:border-rose-300 hover:bg-rose-50/70 hover:shadow-xs active:scale-98 dark:border-neutral-800 dark:bg-neutral-900/80 dark:hover:border-rose-800/80 dark:hover:bg-rose-950/40"
                    title={
                        activePlaying
                            ? 'Pausar narración'
                            : 'Escuchar este artículo'
                    }
                >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white shadow-xs transition-transform group-hover:scale-105">
                        {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : activePlaying ? (
                            <Pause className="h-3 w-3 fill-current" />
                        ) : (
                            <Play className="h-3 w-3 fill-current" />
                        )}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold leading-none text-neutral-800 sm:text-xs dark:text-neutral-200">
                        <Mic className="h-3 w-3 shrink-0 text-rose-500 sm:h-3.5 sm:w-3.5" />
                        <span className="leading-none">
                            {activePlaying
                                ? 'Pausar'
                                : activePaused
                                  ? 'Reanudar'
                                  : 'Escuchar'}
                        </span>
                        {!isInteracting && totalSeconds > 0 && (
                            <span className="ml-0.5 inline-flex items-center text-[10px] font-medium leading-none text-neutral-400 dark:text-neutral-500">
                                ({Math.max(1, Math.ceil(totalSeconds / 60))} min)
                            </span>
                        )}
                    </span>

                    {isAiAudio ? (
                        <span className="hidden items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-rose-600 sm:inline-flex dark:border-rose-400/20 dark:bg-rose-500/20 dark:text-rose-400">
                            <Sparkles className="h-2.5 w-2.5" />
                            Audio IA
                        </span>
                    ) : (
                        <span className="hidden items-center gap-1 rounded-full border border-neutral-200 bg-neutral-200/60 px-1.5 py-0.5 text-[9px] font-medium text-neutral-600 sm:inline-flex dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                            <Volume2 className="h-2.5 w-2.5" />
                            Voz
                        </span>
                    )}

                    {activePlaying && (
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                        </span>
                    )}
                </button>
            </div>

            {hasError && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>
                        Archivo no disponible. Se alternó a voz del navegador.
                    </span>
                </div>
            )}

            {isInteracting && (
                <div className="animate-in slide-in-from-bottom fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200/80 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] shadow-2xl backdrop-blur-md duration-300 dark:border-neutral-800/80 dark:bg-neutral-950/95">
                    <div
                        ref={progressBarRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        className={`group relative flex h-4 w-full select-none items-center touch-none ${
                            isAiAudio && duration > 0 ? 'cursor-pointer' : ''
                        }`}
                    >
                        <div className="relative h-1.5 w-full overflow-hidden bg-neutral-200 transition-all group-hover:h-2 dark:bg-neutral-800">
                            <div
                                className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        {isAiAudio && duration > 0 && (
                            <div
                                className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-rose-500 shadow-sm transition-transform group-hover:scale-125 dark:border-neutral-900"
                                style={{ left: `${progressPercent}%` }}
                            />
                        )}
                    </div>

                    <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
                        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                            <div className="hidden xs:flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                                <Headphones className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="truncate text-xs font-bold text-neutral-900 sm:text-sm dark:text-neutral-100">
                                    {title}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400">
                                    <span className="hidden sm:inline-flex items-center gap-1">
                                        <Mic className="h-3 w-3 text-rose-500" />
                                        {isAiAudio ? 'Audio IA' : 'Voz'}
                                    </span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="font-mono">
                                        {formatTime(currentSeconds)} / {formatTime(totalSeconds)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                            {isAiAudio && (
                                <button
                                    type="button"
                                    onClick={handleCycleSpeed}
                                    className="hidden rounded-lg border border-neutral-200 bg-neutral-100 px-2 py-1 font-mono text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-200 sm:inline-flex dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
                                    title="Velocidad de reproducción"
                                >
                                    {PLAYBACK_SPEEDS[speedIndex]}x
                                </button>
                            )}

                            {isAiAudio && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleSkip(-10)}
                                        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:scale-95 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                                        title="Retroceder 10 segundos"
                                        aria-label="Retroceder 10 segundos"
                                    >
                                        <span className="text-[11px] sm:text-xs font-bold font-mono">-10s</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleSkip(10)}
                                        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:scale-95 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                                        title="Adelantar 10 segundos"
                                        aria-label="Adelantar 10 segundos"
                                    >
                                        <span className="text-[11px] sm:text-xs font-bold font-mono">+10s</span>
                                    </button>
                                </>
                            )}

                            {!isAiAudio && (
                                <button
                                    type="button"
                                    onClick={handleRestart}
                                    className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:scale-95 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                                    title="Reiniciar"
                                    aria-label="Reiniciar audio"
                                >
                                    <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handlePlayPause}
                                className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white shadow-md transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-neutral-950"
                                aria-label={
                                    activePlaying ? 'Pausar' : 'Reproducir'
                                }
                            >
                                {activePlaying ? (
                                    <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                                ) : (
                                    <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    containerRef.current?.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'center',
                                    });
                                }}
                                className="hidden xs:flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-white"
                                title="Subir al inicio del artículo"
                                aria-label="Subir al artículo"
                            >
                                <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={handleClosePlayer}
                                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-neutral-200/70 hover:text-neutral-900 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-white"
                                title="Cerrar reproductor"
                                aria-label="Cerrar reproductor de audio"
                            >
                                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
