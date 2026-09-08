import { Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function GoogleAuthButton() {
    return (
        <>
            <div className="grid gap-2">
                <Button variant="outline" className="w-full" asChild>
                    <a href="/auth/google">
                        <Chrome className="h-4 w-4" />
                        Continuar con Google
                    </a>
                </Button>
            </div>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background text-muted-foreground px-2">
                        O continúa con tu correo
                    </span>
                </div>
            </div>
        </>
    );
}
