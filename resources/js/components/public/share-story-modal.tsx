import { useState } from 'react';
import { Download, Sparkles, X, Check, Copy } from 'lucide-react';
import type { PublicArticle } from '@/types';
import { toast } from 'sonner';

interface ShareStoryArticle {
    title: string;
    category?: string | { name?: string; label?: string; slug?: string } | null;
    excerpt?: string | null;
    featured_image?: string | null;
}

interface ShareStoryModalProps {
    article: ShareStoryArticle;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShareStoryModal({ article, open, onOpenChange }: ShareStoryModalProps) {
    const [copied, setCopied] = useState(false);

    if (!open) return null;

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            setCopied(true);
            toast.success('Enlace de la historia copiado');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('No se pudo copiar');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
                <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                        Social Card
                    </span>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                        Comparte en tus Historias
                    </h3>
                </div>

                <div className="relative mx-auto aspect-[9/14] w-full max-w-[240px] overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950 p-4 text-white shadow-lg">
                    {article.featured_image && (
                        <img
                            src={article.featured_image}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover opacity-40 blur-xs scale-110"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />

                    <div className="relative z-10 flex h-full flex-col justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs">
                                <Sparkles className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-black tracking-tight text-white">
                                Kawaii<span className="text-rose-400">News</span>
                            </span>
                        </div>

                        <div className="space-y-2">
                            <span className="inline-block rounded-md bg-rose-500/80 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                                {typeof article.category === 'string'
                                    ? article.category
                                    : article.category?.label ?? article.category?.name ?? 'Anime'}
                            </span>
                            <h4 className="text-xs font-bold leading-snug text-white line-clamp-4">
                                {article.title}
                            </h4>
                            <p className="text-[10px] text-neutral-300 line-clamp-2">
                                {article.excerpt}
                            </p>
                        </div>

                        <div className="rounded-xl border border-white/20 bg-white/10 p-2 text-center backdrop-blur-md">
                            <span className="text-[10px] font-semibold text-neutral-200">
                                Léelo en kawaiinews.com
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-500 active:scale-95 transition"
                    >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span>{copied ? 'Copiado' : 'Copiar enlace'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
