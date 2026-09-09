import { useSpeechNarrator } from '@/hooks/use-speech-narrator';
import {
    AlertCircle,
    Eye,
    EyeOff,
    Headphones,
    Loader2,
    Pause,
    Play,
    RotateCcw,
    Sparkles,
    Volume2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
    const textToRead = `${title}. ${body ?? ''}`;
    const speech = useSpeechNarrator(textToRead);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [speedIndex, setSpeedIndex] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);

    const isAiAudio = Boolean(audioUrl && !hasError);

    useEffect(() => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentTime(0);
        setDuration(0);
        setHasError(false);
        setIsLoading(false);
    }, [audioUrl]);

    const handlePlayPause = () => {
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

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nextTime = Number(e.target.value);
        setCurrentTime(nextTime);
        if (isAiAudio && audioRef.current) {
            audioRef.current.currentTime = nextTime;
        }
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
    const isInteracting = activePlaying || activePaused;

    const formatTime = (secs: number) => {
        if (!Number.isFinite(secs) || secs <= 0) {
            return '0:00';
        }
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const progressPercent =
        duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    useEffect(() => {
        if (!isAiAudio || !isPlaying || !autoScroll || duration <= 0) {
            return;
        }

        const elements: HTMLElement[] = [];

        const titleEl = document.getElementById('article-title');
        if (titleEl) {
            elements.push(titleEl);
        }

        const excerptEl = document.getElementById('article-excerpt');
        if (excerptEl) {
            elements.push(excerptEl);
        }

        const container = document.getElementById('article-content-body');
        if (container) {
            const bodyEls = container.querySelectorAll('p, h2, h3, blockquote');
            bodyEls.forEach((el) => {
                if (el instanceof HTMLElement && el.innerText.trim().length > 0) {
                    elements.push(el);
                }
            });
        }

        if (elements.length === 0) {
            return;
        }

        const lengths = elements.map((el) => Math.max(20, el.innerText.trim().length));
        const totalChars = lengths.reduce((acc, curr) => acc + curr, 0);

        let cumulative = 0;
        const thresholds = lengths.map((len) => {
            cumulative += len;
            return cumulative / totalChars;
        });

        const currentRatio = Math.min(1, Math.max(0, currentTime / duration));

        let activeIdx = thresholds.findIndex((t) => currentRatio <= t);
        if (activeIdx === -1) {
            activeIdx = elements.length - 1;
        }

        const currentElement = elements[activeIdx];

        elements.forEach((el, idx) => {
            if (idx === activeIdx) {
                el.classList.add(
                    'bg-rose-500/10',
                    'dark:bg-rose-500/15',
                    'rounded-xl',
                    'px-2',
                    'py-1',
                    '-mx-2',
                    'transition-all',
                    'duration-300',
                );
            } else {
                el.classList.remove(
                    'bg-rose-500/10',
                    'dark:bg-rose-500/15',
                    'rounded-xl',
                    'px-2',
                    'py-1',
                    '-mx-2',
                );
            }
        });

        if (currentElement) {
            const rect = currentElement.getBoundingClientRect();
            const isInView =
                rect.top >= 120 && rect.bottom <= window.innerHeight - 100;

            if (!isInView) {
                currentElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
        }
    }, [currentTime, isPlaying, autoScroll, duration, isAiAudio]);

    useEffect(() => {
        if (onProgressChange) {
            onProgressChange(progressPercent, activePlaying);
        }
    }, [progressPercent, activePlaying, onProgressChange]);

    if (!audioUrl && !speech.isSupported) {
        return null;
    }

    return (
        <div className="group/player my-4">
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
                        setCurrentTime(e.currentTarget.currentTime);
                    }}
                    onPlay={() => {
                        setIsPlaying(true);
                        setIsPaused(false);
                        setIsLoading(false);
                    }}
                    onPause={() => {
                        setIsPlaying(false);
                        setIsPaused(true);
                        setIsLoading(false);
                    }}
                    onEnded={() => {
                        setIsPlaying(false);
                        setIsPaused(false);
                        setCurrentTime(0);
                    }}
                    onError={() => {
                        setHasError(true);
                        setIsPlaying(false);
                        setIsPaused(false);
                        setIsLoading(false);
                    }}
                    onWaiting={() => setIsLoading(true)}
                    onCanPlay={() => setIsLoading(false)}
                />
            )}

            <div className="relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-neutral-50/90 p-3 shadow-xs transition-all hover:border-neutral-300 dark:border-neutral-800/80 dark:bg-neutral-900/50 dark:hover:border-neutral-700">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handlePlayPause}
                            disabled={isLoading}
                            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-75 dark:bg-white dark:text-neutral-950"
                            aria-label={activePlaying ? 'Pausar narración' : 'Escuchar artículo'}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-current" />
                            ) : activePlaying ? (
                                <Pause className="h-4 w-4 fill-current" />
                            ) : (
                                <Play className="h-4 w-4 fill-current translate-x-0.5" />
                            )}
                        </button>

                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    {activePlaying
                                        ? 'Reproduciendo narración'
                                        : activePaused
                                          ? 'Narración en pausa'
                                          : 'Escuchar este artículo'}
                                </span>

                                {isAiAudio ? (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:border-rose-400/20 dark:bg-rose-500/20 dark:text-rose-400">
                                        <Sparkles className="h-2.5 w-2.5" />
                                        Audio IA
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-200/50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                                        <Volume2 className="h-2.5 w-2.5" />
                                        Voz navegador
                                    </span>
                                )}

                                {activePlaying && (
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                                    </span>
                                )}
                            </div>

                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                {isAiAudio
                                    ? 'Locución natural generada por inteligencia artificial'
                                    : 'Lectura asistida mediante síntesis de voz en español'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {isAiAudio && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setAutoScroll(!autoScroll)}
                                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${
                                        autoScroll
                                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:border-rose-400/30 dark:bg-rose-500/20 dark:text-rose-400'
                                            : 'border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                                    }`}
                                    title={
                                        autoScroll
                                            ? 'Desplazamiento sincronizado activado'
                                            : 'Desplazamiento sincronizado desactivado'
                                    }
                                >
                                    {autoScroll ? (
                                        <Eye className="h-3 w-3" />
                                    ) : (
                                        <EyeOff className="h-3 w-3" />
                                    )}
                                    <span className="hidden sm:inline">
                                        Seguir
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCycleSpeed}
                                    className="rounded-lg border border-neutral-200 bg-white px-2 py-1 font-mono text-[11px] font-semibold text-neutral-700 shadow-2xs transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                                    title="Cambiar velocidad de reproducción"
                                >
                                    {PLAYBACK_SPEEDS[speedIndex]}x
                                </button>
                            </>
                        )}

                        {isInteracting && (
                            <button
                                type="button"
                                onClick={handleRestart}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-200/60 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                                title="Reiniciar desde el inicio"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {isAiAudio && (duration > 0 || isInteracting) && (
                    <div className="mt-3 pt-2.5 border-t border-neutral-200/60 dark:border-neutral-800/60">
                        <div className="flex items-center gap-2.5">
                            <span className="w-8 text-right font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
                                {formatTime(currentTime)}
                            </span>

                            <div className="relative flex-1 flex items-center">
                                <input
                                    type="range"
                                    min={0}
                                    max={duration || 100}
                                    step={0.5}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-rose-500 dark:bg-neutral-800"
                                />
                            </div>

                            <span className="w-8 font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
                                {formatTime(duration)}
                            </span>
                        </div>
                    </div>
                )}

                {hasError && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>Archivo de audio no disponible. Se alternó a voz del navegador.</span>
                    </div>
                )}
            </div>
        </div>
    );
}

