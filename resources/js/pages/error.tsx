import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Home,
    AlertTriangle,
    ShieldAlert,
    FileQuestion,
    ServerCrash,
    RefreshCw,
    Sparkles,
} from 'lucide-react';

interface ErrorPageProps {
    status: number;
}

const errorDetails: Record<
    number,
    {
        title: string;
        headline: string;
        description: string;
        icon: typeof AlertTriangle;
        color: string;
        bgColor: string;
    }
> = {
    404: {
        title: '404 - Página no encontrada',
        headline: '¡Ups! Esta página se perdió en otra dimensión',
        description:
            'La noticia o sección que buscas no existe, cambió de nombre o fue retirada de nuestro portal.',
        icon: FileQuestion,
        color: 'text-rose-500',
        bgColor: 'bg-rose-500/10 dark:bg-rose-500/20',
    },
    403: {
        title: '403 - Acceso denegado',
        headline: 'Área restringida',
        description:
            'No tienes los permisos necesarios para ver este contenido o acceder a esta sección.',
        icon: ShieldAlert,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
    },
    500: {
        title: '500 - Error del servidor',
        headline: 'Algo salió mal en nuestros servidores',
        description:
            'Nuestros ingenieros ya están al tanto y trabajando para restablecer el servicio a la brevedad.',
        icon: ServerCrash,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10 dark:bg-red-500/20',
    },
    503: {
        title: '503 - Servicio en mantenimiento',
        headline: 'Estamos en mantenimiento programado',
        description:
            'KawaiiNews está recibiendo mejoras en este momento. Por favor vuelve a intentarlo en unos minutos.',
        icon: AlertTriangle,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10 dark:bg-orange-500/20',
    },
};

export default function ErrorPage({ status }: ErrorPageProps) {
    const error = errorDetails[status] ?? {
        title: `${status} - Error`,
        headline: 'Ha ocurrido un error inesperado',
        description:
            'Se produjo un problema al procesar tu solicitud. Por favor intenta recargar la página o volver a la portada.',
        icon: AlertTriangle,
        color: 'text-rose-500',
        bgColor: 'bg-rose-500/10 dark:bg-rose-500/20',
    };

    const Icon = error.icon;

    return (
        <div className="flex min-h-screen flex-col bg-neutral-50 font-sans text-neutral-900 selection:bg-rose-500 selection:text-white dark:bg-neutral-950 dark:text-neutral-100">
            <Head title={`${error.title} - KawaiiNews`} />

            {/* Header simple */}
            <header className="border-b border-neutral-200/80 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-neutral-900/80 dark:bg-neutral-950/80">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-neutral-950 dark:text-white">
                            Kawaii<span className="text-rose-500">News</span>
                        </span>
                    </Link>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Volver a la portada</span>
                    </Link>
                </div>
            </header>

            {/* Contenido del Error */}
            <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
                <div className="w-full max-w-md text-center">
                    <div
                        className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl ${error.bgColor}`}
                    >
                        <Icon className={`h-10 w-10 ${error.color}`} />
                    </div>

                    <span className="inline-block font-mono text-5xl font-black tracking-tight text-neutral-950 sm:text-6xl dark:text-white">
                        {status}
                    </span>

                    <h1 className="mt-3 text-lg font-bold tracking-tight text-neutral-900 sm:text-xl dark:text-neutral-100">
                        {error.headline}
                    </h1>

                    <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed dark:text-neutral-400">
                        {error.description}
                    </p>

                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link
                            href="/"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500 active:scale-95 sm:w-auto"
                        >
                            <Home className="h-4 w-4" />
                            <span>Ir al inicio</span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-2.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 active:scale-95 sm:w-auto dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Recargar página</span>
                        </button>
                    </div>
                </div>
            </main>

            {/* Footer mínimo */}
            <footer className="border-t border-neutral-200/80 py-6 text-center text-xs text-neutral-500 dark:border-neutral-900/80 dark:text-neutral-500">
                © {new Date().getFullYear()} KawaiiNews. Todos los derechos reservados.
            </footer>
        </div>
    );
}
