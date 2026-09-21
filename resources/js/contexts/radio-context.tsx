import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import type { RadioQueueItem } from '@/types/admin';

interface RadioContextType {
    isPlaying: boolean;
    isMuted: boolean;
    volume: number;
    currentTrack: RadioQueueItem | null;
    queue: RadioQueueItem[];
    isLive: boolean;
    isDockVisible: boolean;
    isMinimized: boolean;
    currentTime: number;
    duration: number;
    isLoading: boolean;
    hasError: boolean;
    isPausedByArticle: boolean;
    autoplayPref: boolean | null;
    showAutoplayPrompt: boolean;
    setAutoplayPref: (pref: boolean) => void;
    dismissAutoplayPrompt: () => void;
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    toggleMute: () => void;
    setVolume: (volume: number) => void;
    nextTrack: () => void;
    prevTrack: () => void;
    jumpToLive: () => void;
    setDockVisible: (visible: boolean) => void;
    setIsMinimized: (minimized: boolean) => void;
    notifyArticleAudioPlaying: () => void;
    notifyArticleAudioStopped: () => void;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export function RadioProvider({ children }: { children: React.ReactNode }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [queue, setQueue] = useState<RadioQueueItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolumeState] = useState(0.85);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [isDockVisible, setDockVisible] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isPausedByArticle, setIsPausedByArticle] = useState(false);
    const [isLive, setIsLive] = useState(true);
    const [autoplayPref, setAutoplayPrefState] = useState<boolean | null>(() => {
        if (typeof window === 'undefined') return null;
        const stored = localStorage.getItem('kawaii_radio_autoplay');
        return stored === null ? null : stored === 'true';
    });
    const [showAutoplayPrompt, setShowAutoplayPrompt] = useState(false);

    const queueRef = useRef<RadioQueueItem[]>([]);
    const currentIndexRef = useRef(0);
    const isPlayingRef = useRef(false);
    const isPausedByArticleRef = useRef(false);
    const isLoadingRef = useRef(false);

    queueRef.current = queue;
    currentIndexRef.current = currentIndex;
    isPlayingRef.current = isPlaying;
    isPausedByArticleRef.current = isPausedByArticle;
    isLoadingRef.current = isLoading;

    const currentTrack = queue[currentIndex] ?? null;

    const setAutoplayPref = useCallback((pref: boolean) => {
        setAutoplayPrefState(pref);
        setShowAutoplayPrompt(false);
        if (typeof window !== 'undefined') {
            localStorage.setItem('kawaii_radio_autoplay', String(pref));
        }
    }, []);

    const dismissAutoplayPrompt = useCallback(() => {
        setShowAutoplayPrompt(false);
        if (typeof window !== 'undefined') {
            localStorage.setItem('kawaii_radio_autoplay', 'false');
        }
        setAutoplayPrefState(false);
    }, []);

    const fetchQueueAndSync = useCallback(async (autoPlay = false) => {
        try {
            setIsLoading(true);
            isLoadingRef.current = true;
            setHasError(false);
            const res = await fetch('/radio/queue.json');
            if (!res.ok) throw new Error('Error al cargar la radio');
            const data = await res.json();

            const items: RadioQueueItem[] = data.queue || [];
            if (items.length === 0) {
                isLoadingRef.current = false;
                setIsLoading(false);
                return;
            }

            setQueue(items);

            const liveIndex = data.current_track_index ?? 0;
            const liveOffset = data.current_track_offset ?? 0;

            setCurrentIndex(liveIndex);
            setIsLive(true);

            if (audioRef.current && items[liveIndex]) {
                const targetTrack = items[liveIndex];
                if (audioRef.current.src !== targetTrack.audio_url) {
                    audioRef.current.src = targetTrack.audio_url;
                }
                audioRef.current.currentTime = liveOffset;

                if (autoPlay) {
                    setDockVisible(true);
                    setIsPlaying(true);
                    audioRef.current.play().then(() => {
                        isLoadingRef.current = false;
                        setIsLoading(false);
                        setIsPlaying(true);
                    }).catch(() => {
                        isLoadingRef.current = false;
                        setIsLoading(false);
                        setIsPlaying(false);
                    });
                } else {
                    isLoadingRef.current = false;
                    setIsLoading(false);
                }
            } else {
                isLoadingRef.current = false;
                setIsLoading(false);
            }
        } catch {
            isLoadingRef.current = false;
            setHasError(true);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const audio = new Audio();
        audioRef.current = audio;
        audio.preload = 'auto';
        audio.volume = volume;

        const onTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const onLoadedMetadata = () => {
            setDuration(audio.duration || 0);
            setIsLoading(false);
        };

        const onCanPlay = () => {
            setIsLoading(false);
        };

        const onWaiting = () => {
            setIsLoading(true);
        };

        const onPlaying = () => {
            isLoadingRef.current = false;
            setIsLoading(false);
            setIsPlaying(true);
        };

        const onPause = () => {
            if (isLoadingRef.current) return;
            setIsLoading(false);
            setIsPlaying(false);
        };

        const onEnded = () => {
            const q = queueRef.current;
            const idx = currentIndexRef.current;
            if (q.length > 0) {
                const nextIdx = (idx + 1) % q.length;
                setCurrentIndex(nextIdx);
                const nextTrackItem = q[nextIdx];
                if (nextTrackItem && audioRef.current) {
                    audioRef.current.src = nextTrackItem.audio_url;
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(() => {});
                }
            }
        };

        const onError = () => {
            setIsLoading(false);
            setHasError(true);
        };

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('waiting', onWaiting);
        audio.addEventListener('playing', onPlaying);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('waiting', onWaiting);
            audio.removeEventListener('playing', onPlaying);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            audio.pause();
            audio.src = '';
        };
    }, []);

    useEffect(() => {
        if ('mediaSession' in navigator && currentTrack) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentTrack.title,
                artist: currentTrack.artist || (currentTrack.type === 'article' ? 'KawaiiNews Narración IA' : 'KawaiiRadio'),
                album: 'KawaiiRadio En Vivo',
                artwork: currentTrack.image_url ? [
                    { src: currentTrack.image_url, sizes: '512x512', type: 'image/webp' }
                ] : [
                    { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
                ],
            });

            navigator.mediaSession.setActionHandler('play', () => {
                play();
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                pause();
            });
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                nextTrack();
            });
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                prevTrack();
            });
        }
    }, [currentTrack]);

    useEffect(() => {
        if (autoplayPref === true) {
            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
                return;
            }
            fetchQueueAndSync(true);
        }
    }, [autoplayPref, fetchQueueAndSync]);

    const play = useCallback(() => {
        if (!audioRef.current) return;

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('kawaii:stop-article-audio'));
        }

        isPausedByArticleRef.current = false;
        setIsPausedByArticle(false);
        setDockVisible(true);

        if (autoplayPref === null) {
            setShowAutoplayPrompt(true);
        }

        if (queue.length === 0) {
            fetchQueueAndSync(true);
            return;
        }

        const track = queue[currentIndex];
        if (track) {
            if (audioRef.current.src !== track.audio_url) {
                audioRef.current.src = track.audio_url;
            }
            setIsLoading(true);
            isLoadingRef.current = true;
            setIsPlaying(true);
            audioRef.current.play().then(() => {
                isLoadingRef.current = false;
                setIsLoading(false);
                setIsPlaying(true);
            }).catch(() => {
                isLoadingRef.current = false;
                setIsLoading(false);
                setIsPlaying(false);
            });
        }
    }, [queue, currentIndex, fetchQueueAndSync, autoplayPref]);

    const pause = useCallback(() => {
        if (!audioRef.current) return;
        isLoadingRef.current = false;
        audioRef.current.pause();
        setIsPlaying(false);
    }, []);

    const togglePlay = useCallback(() => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    }, [isPlaying, play, pause]);

    const toggleMute = useCallback(() => {
        if (!audioRef.current) return;
        const nextMuted = !isMuted;
        audioRef.current.muted = nextMuted;
        setIsMuted(nextMuted);
    }, [isMuted]);

    const setVolume = useCallback((val: number) => {
        if (!audioRef.current) return;
        const clamped = Math.max(0, Math.min(1, val));
        audioRef.current.volume = clamped;
        setVolumeState(clamped);
        if (clamped === 0) {
            setIsMuted(true);
            audioRef.current.muted = true;
        } else if (isMuted) {
            setIsMuted(false);
            audioRef.current.muted = false;
        }
    }, [isMuted]);

    const nextTrack = useCallback(() => {
        if (queue.length === 0 || !audioRef.current) return;
        setIsLive(false);
        const nextIdx = (currentIndex + 1) % queue.length;
        setCurrentIndex(nextIdx);
        const track = queue[nextIdx];
        if (track) {
            audioRef.current.src = track.audio_url;
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
        }
    }, [queue, currentIndex]);

    const prevTrack = useCallback(() => {
        if (queue.length === 0 || !audioRef.current) return;
        setIsLive(false);
        const prevIdx = (currentIndex - 1 + queue.length) % queue.length;
        setCurrentIndex(prevIdx);
        const track = queue[prevIdx];
        if (track) {
            audioRef.current.src = track.audio_url;
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
        }
    }, [queue, currentIndex]);

    const jumpToLive = useCallback(() => {
        fetchQueueAndSync(true);
    }, [fetchQueueAndSync]);

    const notifyArticleAudioPlaying = useCallback(() => {
        if (audioRef.current && isPlayingRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            setIsPausedByArticle(true);
        }
    }, []);

    const notifyArticleAudioStopped = useCallback(() => {
        if (isPausedByArticleRef.current) {
            isPausedByArticleRef.current = false;
            setIsPausedByArticle(false);
            fetchQueueAndSync(true);
        }
    }, [fetchQueueAndSync]);

    return (
        <RadioContext.Provider
            value={{
                isPlaying,
                isMuted,
                volume,
                currentTrack,
                queue,
                isLive,
                isDockVisible,
                isMinimized,
                currentTime,
                duration,
                isLoading,
                hasError,
                isPausedByArticle,
                autoplayPref,
                showAutoplayPrompt,
                setAutoplayPref,
                dismissAutoplayPrompt,
                play,
                pause,
                togglePlay,
                toggleMute,
                setVolume,
                nextTrack,
                prevTrack,
                jumpToLive,
                setDockVisible,
                setIsMinimized,
                notifyArticleAudioPlaying,
                notifyArticleAudioStopped,
            }}
        >
            {children}
        </RadioContext.Provider>
    );
}

export function useRadioPlayer() {
    const context = useContext(RadioContext);
    if (!context) {
        throw new Error('useRadioPlayer must be used within a RadioProvider');
    }
    return context;
}
