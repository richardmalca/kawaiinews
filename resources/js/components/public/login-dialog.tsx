import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Chrome, Sparkles } from 'lucide-react';

interface LoginDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
}

export function LoginDialog({
    open,
    onOpenChange,
    title = 'Únete a KawaiiNews',
    description = 'Inicia sesión con tu cuenta de Google para dar me gusta, guardar noticias y personalizar tu perfil de lector.',
}: LoginDialogProps) {
    const returnUrl = typeof window !== 'undefined' ? window.location.href : '/';
    const googleLoginUrl = `/auth/google?return_to=${encodeURIComponent(returnUrl)}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-3xl border-neutral-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8 dark:border-neutral-800/80 dark:bg-neutral-900/95">
                <DialogHeader className="items-center text-center">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 ring-8 ring-rose-500/5 dark:bg-rose-500/20 dark:text-rose-400">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl dark:text-neutral-100">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="mt-1.5 text-xs leading-relaxed text-neutral-500 sm:text-sm dark:text-neutral-400">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-6 flex flex-col gap-4">
                    <Button
                        size="lg"
                        className="w-full h-12 rounded-2xl bg-neutral-950 font-semibold text-white shadow-lg shadow-neutral-950/10 transition-all hover:bg-neutral-800 hover:shadow-xl dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                        asChild
                    >
                        <a href={googleLoginUrl} className="flex items-center justify-center gap-3 text-sm">
                            <Chrome className="h-5 w-5 text-rose-500" />
                            <span>Continuar con Google</span>
                        </a>
                    </Button>

                    <div className="rounded-2xl border border-neutral-100 bg-neutral-50/70 p-3.5 text-center text-xs text-neutral-500 dark:border-neutral-850 dark:bg-neutral-800/40 dark:text-neutral-400">
                        Acceso rápido y seguro sin contraseñas complicadas. Tu cuenta de Google garantiza tu privacidad.
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
