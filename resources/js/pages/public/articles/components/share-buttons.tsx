import { useShare } from '@/hooks/use-share';
import { Check, Copy, MessageCircle, Send, Share2, Smartphone } from 'lucide-react';

interface ShareButtonsProps {
    title: string;
    text?: string | null;
    category?: string;
    url?: string;
    sharesCount?: number;
    onShare?: (channel: 'whatsapp' | 'twitter' | 'facebook' | 'telegram' | 'native' | 'link') => void;
}

export function ShareButtons({
    title,
    text,
    category,
    url,
    sharesCount,
    onShare,
}: ShareButtonsProps) {
    const {
        copied,
        whatsappUrl,
        twitterUrl,
        telegramUrl,
        facebookUrl,
        canNativeShare,
        handleNativeShare,
        handleCopyLink,
    } = useShare({
        title,
        text,
        url,
        category,
        onShare,
    });

    return (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-400">
                <Share2 className="h-3.5 w-3.5" />
                <span>Compartir</span>
                {typeof sharesCount === 'number' && sharesCount > 0 && (
                    <span className="rounded-full bg-neutral-100 px-1.5 py-0.2 font-mono text-[10px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        {sharesCount}
                    </span>
                )}
                :
            </span>

            {canNativeShare && (
                <button
                    type="button"
                    onClick={handleNativeShare}
                    title="Compartir desde tu dispositivo"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-xs font-bold text-rose-500 transition-colors hover:border-rose-300 hover:bg-rose-50 sm:hidden dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-rose-950/40"
                    aria-label="Compartir nativo"
                >
                    <Smartphone className="h-4 w-4" />
                </button>
            )}

            <a
                href={twitterUrl}
                onClick={() => onShare?.('twitter')}
                target="_blank"
                rel="noopener noreferrer"
                title="Compartir en X / Twitter"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-xs font-bold text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-800"
                aria-label="Compartir en X"
            >
                𝕏
            </a>

            <a
                href={whatsappUrl}
                onClick={() => onShare?.('whatsapp')}
                target="_blank"
                rel="noopener noreferrer"
                title="Compartir en WhatsApp"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
                aria-label="Compartir en WhatsApp"
            >
                <MessageCircle className="h-4 w-4" />
            </a>

            <a
                href={telegramUrl}
                onClick={() => onShare?.('telegram')}
                target="_blank"
                rel="noopener noreferrer"
                title="Compartir en Telegram"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-600 transition-colors hover:bg-sky-500/20 dark:text-sky-400"
                aria-label="Compartir en Telegram"
            >
                <Send className="h-4 w-4" />
            </a>

            <a
                href={facebookUrl}
                onClick={() => onShare?.('facebook')}
                target="_blank"
                rel="noopener noreferrer"
                title="Compartir en Facebook"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-500/20 dark:text-blue-400"
                aria-label="Compartir en Facebook"
            >
                f
            </a>

            <button
                type="button"
                onClick={handleCopyLink}
                title="Copiar enlace del artículo"
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
                        <span className="hidden sm:inline">Copiar enlace</span>
                    </>
                )}
            </button>
        </div>
    );
}
