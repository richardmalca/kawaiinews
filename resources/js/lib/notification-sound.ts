/**
 * Notification sound and browser notification helpers.
 */

// Simple synthesizer using Web Audio API so no heavy external mp3 is needed
export function playNotificationSound(): void {
    try {
        const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const now = ctx.currentTime;

        // Two-tone soft chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now); // E5
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1318.51, now); // E6
        osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.18); // A6

        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);

        osc1.stop(now + 0.46);
        osc2.stop(now + 0.46);

        // Auto close audio context after playing
        setTimeout(() => {
            try {
                ctx.close();
            } catch {
                // Ignore
            }
        }, 600);
    } catch {
        // Silently ignore if user has not interacted with DOM yet
    }
}

/**
 * Check if the browser supports Desktop/Mobile notifications
 */
export function isBrowserNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission
 */
export function getNotificationPermission(): NotificationPermission {
    if (!isBrowserNotificationSupported()) return 'denied';
    return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestBrowserNotificationPermission(): Promise<boolean> {
    if (!isBrowserNotificationSupported()) return false;

    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch {
        return false;
    }
}

/**
 * Display a native desktop/mobile system notification
 */
export function showBrowserNotification(
    title: string,
    options?: {
        body?: string;
        icon?: string;
        url?: string;
        tag?: string;
    },
): void {
    if (
        !isBrowserNotificationSupported() ||
        Notification.permission !== 'granted'
    ) {
        return;
    }

    try {
        const notification = new Notification(title, {
            body: options?.body || '',
            icon: options?.icon || '/android-chrome-192x192.png',
            tag: options?.tag || 'kawaiinews-notification',
            badge: '/favicon-32.png',
        });

        if (options?.url) {
            notification.onclick = (event) => {
                event.preventDefault();
                window.focus();
                window.location.href = options.url!;
                notification.close();
            };
        }
    } catch {
        // En móviles algunos navegadores pueden requerir ServiceWorker, capturado limpiamente
    }
}
