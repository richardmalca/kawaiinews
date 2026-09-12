import { useState } from 'react';
import { Download, Sparkles, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { FALLBACK_IMAGES, handleImageFallback } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

    const generateCanvasBlob = async (): Promise<Blob | null> => {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

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
                    setTimeout(() => resolve(false), 3000);
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

        return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    };

    const handleSaveOrShare = async () => {
        if (isExporting) return;
        setIsExporting(true);
        const toastId = toast.loading('Generando imagen para Story...');

        try {
            const blob = await generateCanvasBlob();
            if (!blob) {
                toast.error('No se pudo generar la imagen', { id: toastId });
                setIsExporting(false);
                return;
            }

            const file = new File([blob], `kawaiinews-story-${Date.now()}.png`, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: article.title,
                        text: `${article.title} - KawaiiNews`,
                        files: [file],
                    });
                    toast.success('Compartido / Guardado con éxito', { id: toastId });
                    setIsExporting(false);
                    return;
                } catch (err: any) {
                    if (err?.name === 'AbortError') {
                        toast.dismiss(toastId);
                        setIsExporting(false);
                        return;
                    }
                }
            }

            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.download = `kawaiinews-story-${Date.now()}.png`;
            a.href = blobUrl;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            }, 1000);

            toast.success('Imagen descargada con éxito', { id: toastId });
        } catch {
            toast.error('Error al procesar la imagen', { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[340px] sm:max-w-sm rounded-3xl border-neutral-200/80 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
                <DialogHeader className="mb-1 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
                        Social Card (9:16)
                    </span>
                    <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                        Comparte en tus Historias
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Previsualiza y comparte esta noticia en formato vertical para historias.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-1">
                    <div className="relative mx-auto aspect-[9/16] w-full max-w-[220px] overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-white shadow-xl">
                        <img
                            src={bgImage}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover opacity-60"
                            onError={(e) => handleImageFallback(e, FALLBACK_IMAGES.hero)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-black/70 pointer-events-none" />

                        <div className="relative z-10 flex h-full flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs">
                                        <Sparkles className="h-3 w-3" />
                                    </div>
                                    <span className="text-xs font-black tracking-tight text-white">
                                        Kawaii<span className="text-rose-400">News</span>
                                    </span>
                                </div>
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase text-white/80">
                                    Story
                                </span>
                            </div>

                            <div className="space-y-1.5">
                                <span className="inline-block rounded-md bg-rose-600 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                                    {categoryName}
                                </span>
                                <h4 className="text-xs font-black leading-snug text-white line-clamp-3">
                                    {article.title}
                                </h4>
                                {article.excerpt && (
                                    <p className="text-[10px] text-neutral-300 line-clamp-2">
                                        {article.excerpt}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-xl border border-white/20 bg-white/10 px-2 py-1 text-center backdrop-blur-xs">
                                <span className="text-[9px] font-bold text-neutral-200">
                                    kawaiinews.com
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex gap-2">
                    <Button
                        type="button"
                        onClick={handleSaveOrShare}
                        disabled={isExporting}
                        className="flex-1 h-10 rounded-xl bg-rose-600 font-bold text-white hover:bg-rose-500 active:scale-95 transition"
                    >
                        {isExporting ? (
                            <>
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                <span>Generando PNG...</span>
                            </>
                        ) : (
                            <>
                                <Download className="h-3.5 w-3.5" />
                                <span>Guardar en dispositivo</span>
                            </>
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopyUrl}
                        className="h-10 rounded-xl border-neutral-300 bg-white font-bold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? 'Copiado' : 'Enlace'}</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
