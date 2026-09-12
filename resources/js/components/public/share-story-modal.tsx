import { useState, useRef } from 'react';
import { Download, Sparkles, X, Check, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { FALLBACK_IMAGES } from '@/lib/utils';

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
    const [isExporting, setIsExporting] = useState(false);

    if (!open) return null;

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const categoryName =
        typeof article.category === 'string'
            ? article.category
            : article.category?.label ?? article.category?.name ?? 'Anime';
    const bgImage = article.featured_image || FALLBACK_IMAGES.hero;

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

    const handleDownloadImage = async () => {
        setIsExporting(true);
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1920;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                toast.error('No se pudo generar la imagen');
                return;
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = bgImage;

            await new Promise((resolve) => {
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
            });

            ctx.fillStyle = '#09090b';
            ctx.fillRect(0, 0, 1080, 1920);

            if (img.width > 0) {
                const hRatio = canvas.width / img.width;
                const vRatio = canvas.height / img.height;
                const ratio = Math.max(hRatio, vRatio);
                const centerShiftX = (canvas.width - img.width * ratio) / 2;
                const centerShiftY = (canvas.height - img.height * ratio) / 2;
                ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
            }

            const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
            gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.2)');
            gradient.addColorStop(0.65, 'rgba(0, 0, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(9, 9, 11, 0.98)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1080, 1920);

            ctx.fillStyle = '#e11d48';
            ctx.beginPath();
            ctx.roundRect(80, 100, 70, 70, 18);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 42px sans-serif';
            ctx.fillText('Kawaii', 170, 150);
            ctx.fillStyle = '#fb7185';
            ctx.fillText('News', 315, 150);

            ctx.fillStyle = '#e11d48';
            ctx.beginPath();
            ctx.roundRect(80, 1180, 240, 52, 14);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px sans-serif';
            ctx.fillText(categoryName.toUpperCase(), 106, 1215);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 54px sans-serif';
            const words = article.title.split(' ');
            let line = '';
            let y = 1310;
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > 920 && n > 0) {
                    ctx.fillText(line, 80, y);
                    line = words[n] + ' ';
                    y += 68;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, 80, y);

            if (article.excerpt) {
                ctx.fillStyle = '#d4d4d8';
                ctx.font = 'normal 32px sans-serif';
                const excerptWords = article.excerpt.split(' ');
                let exLine = '';
                let ey = y + 70;
                for (let i = 0; i < excerptWords.length && ey < 1720; i++) {
                    const testLine = exLine + excerptWords[i] + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > 920 && i > 0) {
                        ctx.fillText(exLine, 80, ey);
                        exLine = excerptWords[i] + ' ';
                        ey += 44;
                    } else {
                        exLine = testLine;
                    }
                }
                ctx.fillText(exLine, 80, ey);
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.beginPath();
            ctx.roundRect(80, 1750, 920, 80, 20);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 30px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('kawaiinews.com', 540, 1800);

            const a = document.createElement('a');
            a.download = `kawaiinews-story-${Date.now()}.png`;
            a.href = canvas.toDataURL('image/png');
            a.click();
            toast.success('Imagen de la historia descargada');
        } catch {
            toast.error('No se pudo guardar la imagen');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
                <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
                        Social Card (9:16)
                    </span>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                        Comparte en tus Historias
                    </h3>
                </div>

                <div className="relative mx-auto aspect-[9/16] w-full max-w-[250px] overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 p-5 text-white shadow-2xl">
                    <img
                        src={bgImage}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-black/70" />

                    <div className="relative z-10 flex h-full flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-black tracking-tight text-white">
                                    Kawaii<span className="text-rose-400">News</span>
                                </span>
                            </div>
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase text-white/80 backdrop-blur-xs">
                                Story
                            </span>
                        </div>

                        <div className="space-y-2.5">
                            <span className="inline-block rounded-lg bg-rose-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                                {categoryName}
                            </span>
                            <h4 className="text-sm font-black leading-snug text-white line-clamp-4 drop-shadow-sm">
                                {article.title}
                            </h4>
                            {article.excerpt && (
                                <p className="text-[11px] leading-relaxed text-neutral-300 line-clamp-3">
                                    {article.excerpt}
                                </p>
                            )}
                        </div>

                        <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-center backdrop-blur-md">
                            <span className="text-[10px] font-bold tracking-wide text-neutral-100">
                                kawaii-news.com
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                        type="button"
                        onClick={handleDownloadImage}
                        disabled={isExporting}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-500 active:scale-95 transition disabled:opacity-50"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span>{isExporting ? 'Generando...' : 'Descargar imagen'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? 'Copiado' : 'Enlace'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
