import { Check, Copy, MessageCircle, Send, Share2 } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonsProps {
    title: string;
    url?: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false);
    const shareUrl =
        url || (typeof window !== 'undefined' ? window.location.href : '');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        title,
    )}&url=${encodeURIComponent(shareUrl)}`;

    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `${title} ${shareUrl}`,
    )}`;

    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
        shareUrl,
    )}&text=${encodeURIComponent(title)}`;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold text-neutral-400">
                <Share2 className="h-3.5 w-3.5" />
                Compartir:
            </span>

            <a
                href={twitterShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-800"
                aria-label="Compartir en X / Twitter"
            >
                <span className="font-bold">X</span>
            </a>

            <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
                aria-label="Compartir en WhatsApp"
            >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
            </a>

            <a
                href={telegramShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 text-xs font-medium text-sky-600 transition-colors hover:bg-sky-500/20 dark:text-sky-400"
                aria-label="Compartir en Telegram"
            >
                <Send className="h-3.5 w-3.5" />
                <span>Telegram</span>
            </a>

            <button
                type="button"
                onClick={handleCopy}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-800"
            >
                {copied ? (
                    <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">
                            ¡Copiado!
                        </span>
                    </>
                ) : (
                    <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar enlace</span>
                    </>
                )}
            </button>
        </div>
    );
}
