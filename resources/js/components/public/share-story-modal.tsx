import { useState, useRef } from 'react';
import { Download, Sparkles, X, Check, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { FALLBACK_IMAGES, handleImageFallback } from '@/lib/utils';

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
        if (isExporting) return;
        setIsExporting(true);
        const toastId = toast.loading('Generando imagen para Story...');

        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1920;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                toast.error('No se pudo inicializar el generador de imagen', { id: toastId });
                setIsExporting(false);
                return;
            }

            ctx.fillStyle = '#09090b';
            ctx.fillRect(0, 0, 1080, 1920);

            let imgLoaded = false;
            let loadedImg: HTMLImageElement | null = null;

            if (bgImage) {
                try {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';

                    let resolvedSrc = bgImage;
                    if (!resolvedSrc.startsWith('data:') && !resolvedSrc.startsWith('blob:')) {
                        try {
                            const res = await fetch(resolvedSrc, { mode: 'cors' });
                            if (res.ok) {
                                const blob = await res.blob();
                                resolvedSrc = URL.createObjectURL(blob);
                            }
                        } catch {
                            // Fallback direct URL if fetch blocked
                        }
                    }

                    img.src = resolvedSrc;
                    imgLoaded = await new Promise<boolean>((resolve) => {
                        if (img.complete && img.naturalWidth > 0) {
                            resolve(true);
                            return;
                        }
                        img.onload = () => resolve(true);
                        img.onerror = () => resolve(false);
                        setTimeout(() => resolve(false), 3500);
                    });

                    if (imgLoaded) {
                        loadedImg = img;
                    }
                } catch {
                    imgLoaded = false;
                }
            }

            if (imgLoaded && loadedImg && loadedImg.naturalWidth > 0) {
                const hRatio = canvas.width / loadedImg.naturalWidth;
                const vRatio = canvas.height / loadedImg.naturalHeight;
                const ratio = Math.max(hRatio, vRatio);
                const centerShiftX = (canvas.width - loadedImg.naturalWidth * ratio) / 2;
                const centerShiftY = (canvas.height - loadedImg.naturalHeight * ratio) / 2;
                ctx.drawImage(
                    loadedImg,
                    0,
                    0,
                    loadedImg.naturalWidth,
                    loadedImg.naturalHeight,
                    centerShiftX,
                    centerShiftY,
                    loadedImg.naturalWidth * ratio,
                    loadedImg.naturalHeight * ratio
                );
            } else {
                const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
                bgGrad.addColorStop(0, '#1c1917');
                bgGrad.addColorStop(0.5, '#4c0519');
                bgGrad.addColorStop(1, '#09090b');
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, 1080, 1920);
            }

            const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
            gradient.addColorStop(0.25, 'rgba(0, 0, 0, 0.3)');
            gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.85)');
            gradient.addColorStop(1, 'rgba(9, 9, 11, 0.98)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1080, 1920);

            ctx.fillStyle = '#e11d48';
            ctx.beginPath();
            ctx.roundRect(80, 100, 70, 70, 18);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 44px sans-serif';
            ctx.fillText('Kawaii', 170, 152);
            ctx.fillStyle = '#fb7185';
            ctx.fillText('News', 320, 152);

            ctx.fillStyle = '#e11d48';
            ctx.beginPath();
            ctx.roundRect(80, 1160, 240, 56, 14);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 26px sans-serif';
            ctx.fillText(categoryName.toUpperCase(), 106, 1198);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 54px sans-serif';
            const words = article.title.split(' ');
            let line = '';
            let y = 1290;
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > 920 && n > 0) {
                    ctx.fillText(line, 80, y);
                    line = words[n] + ' ';
                    y += 70;
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
                        ey += 46;
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

            const dataUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.download = `kawaiinews-story-${Date.now()}.png`;
            a.href = dataUrl;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            toast.success('Imagen lista y descargada', { id: toastId });
        } catch {
            toast.error('Error al generar la imagen', { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in overflow-y-auto">
            <div className="relative my-auto w-full max-w-sm max-h-[92vh] flex flex-col rounded-3xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
                <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 z-20 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="mb-3 shrink-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
                        Social Card (9:16)
                    </span>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                        Comparte en tus Historias
                    </h3>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto py-1">
                    <div className="relative mx-auto aspect-[9/16] w-full max-w-[230px] sm:max-w-[240px] overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 p-4 text-white shadow-2xl">
                        <img
                            src={bgImage}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 hover:scale-105"
                            onError={(e) => handleImageFallback(e, FALLBACK_IMAGES.hero)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-black/70 pointer-events-none" />

                        <div className="relative z-10 flex h-full flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-600 text-white shadow-md">
                                        <Sparkles className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-xs font-black tracking-tight text-white">
                                        Kawaii<span className="text-rose-400">News</span>
                                    </span>
                                </div>
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase text-white/80 backdrop-blur-xs">
                                    Story
                                </span>
                            </div>

                            <div className="space-y-2">
                                <span className="inline-block rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                                    {categoryName}
                                </span>
                                <h4 className="text-xs sm:text-sm font-black leading-snug text-white line-clamp-3 sm:line-clamp-4 drop-shadow-sm">
                                    {article.title}
                                </h4>
                                {article.excerpt && (
                                    <p className="text-[10px] sm:text-[11px] leading-relaxed text-neutral-300 line-clamp-2">
                                        {article.excerpt}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 text-center backdrop-blur-md">
                                <span className="text-[10px] font-bold tracking-wide text-neutral-100">
                                    kawaiinews.com
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-3.5 flex shrink-0 gap-2">
                    <button
                        type="button"
                        onClick={handleDownloadImage}
                        disabled={isExporting}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-500 active:scale-95 transition disabled:opacity-50"
                    >
                        {isExporting ? (
                            <>
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                <span>Generando PNG...</span>
                            </>
                        ) : (
                            <>
                                <Download className="h-3.5 w-3.5" />
                                <span>Descargar imagen</span>
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? 'Copiado' : 'Enlace'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
