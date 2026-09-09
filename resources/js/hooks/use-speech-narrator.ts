import { useEffect, useRef, useState } from 'react';

interface UseSpeechNarratorOptions {
    rate?: number;
    pitch?: number;
}

export function useSpeechNarrator(
    text: string,
    options: UseSpeechNarratorOptions = {},
) {
    const { rate = 1.0, pitch = 1.0 } = options;
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [availableVoices, setAvailableVoices] = useState<
        SpeechSynthesisVoice[]
    >([]);
    const [selectedVoice, setSelectedVoice] =
        useState<SpeechSynthesisVoice | null>(null);

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setIsSupported(true);

            const updateVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                const spanishVoices = voices.filter(
                    (v) =>
                        v.lang.startsWith('es') ||
                        v.lang.includes('es-') ||
                        v.lang.includes('es_'),
                );

                const naturalVoice =
                    spanishVoices.find(
                        (v) =>
                            v.name.includes('Natural') ||
                            v.name.includes('Online') ||
                            v.name.includes('Neural') ||
                            v.name.includes('Google') ||
                            v.name.includes('Sabina') ||
                            v.name.includes('Alvaro') ||
                            v.name.includes('Dalia') ||
                            v.name.includes('Jorge'),
                    ) ??
                    spanishVoices[0] ??
                    voices[0] ??
                    null;

                setAvailableVoices(
                    spanishVoices.length > 0 ? spanishVoices : voices,
                );
                setSelectedVoice(naturalVoice);
            };

            updateVoices();
            window.speechSynthesis.onvoiceschanged = updateVoices;

            return () => {
                window.speechSynthesis.cancel();
            };
        }
    }, []);

    const [progress, setProgress] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timerRef = useRef<number | null>(null);

    const cleanHtml = (raw: string) => {
        if (typeof document === 'undefined') {
            return raw;
        }
        const div = document.createElement('div');
        div.innerHTML = raw;
        return div.textContent || div.innerText || '';
    };

    const cleanText = cleanHtml(text);
    const estimatedTotalSeconds = Math.max(
        1,
        Math.round(cleanText.length / 16),
    );

    const clearTimer = () => {
        if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const play = () => {
        if (!isSupported || !text) {
            return;
        }

        if (isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
            setIsPlaying(true);
            timerRef.current = window.setInterval(() => {
                setElapsedSeconds((prev) => {
                    const next = prev + 1;
                    setProgress(
                        Math.min(
                            100,
                            Math.round((next / estimatedTotalSeconds) * 100),
                        ),
                    );
                    return next;
                });
            }, 1000);
            return;
        }

        window.speechSynthesis.cancel();
        clearTimer();
        setElapsedSeconds(0);
        setProgress(0);

        const utterance = new SpeechSynthesisUtterance(cleanText);

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.rate = rate;
        utterance.pitch = pitch;

        utterance.onboundary = (e) => {
            if (e.charIndex && cleanText.length > 0) {
                const pct = Math.min(
                    100,
                    Math.round((e.charIndex / cleanText.length) * 100),
                );
                setProgress(pct);
            }
        };

        utterance.onstart = () => {
            setIsPlaying(true);
            setIsPaused(false);
            timerRef.current = window.setInterval(() => {
                setElapsedSeconds((prev) => {
                    const next = prev + 1;
                    setProgress(
                        Math.min(
                            100,
                            Math.round((next / estimatedTotalSeconds) * 100),
                        ),
                    );
                    return next;
                });
            }, 1000);
        };

        utterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
            clearTimer();
            setProgress(100);
        };

        utterance.onerror = () => {
            setIsPlaying(false);
            setIsPaused(false);
            clearTimer();
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const pause = () => {
        if (!isSupported) {
            return;
        }
        window.speechSynthesis.pause();
        clearTimer();
        setIsPaused(true);
        setIsPlaying(false);
    };

    const stop = () => {
        if (!isSupported) {
            return;
        }
        window.speechSynthesis.cancel();
        clearTimer();
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        setElapsedSeconds(0);
    };

    return {
        isSupported,
        isPlaying,
        isPaused,
        selectedVoice,
        availableVoices,
        progress,
        elapsedSeconds,
        estimatedTotalSeconds,
        setSelectedVoice,
        play,
        pause,
        stop,
    };
}
