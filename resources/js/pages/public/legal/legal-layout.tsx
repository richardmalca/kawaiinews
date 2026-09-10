import type { ReactNode } from 'react';
import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import type { PublicCategorySummary } from '@/types';
import { ArrowLeft, Cookie, FileText, Scale, Shield, Mail } from 'lucide-react';

interface LegalLayoutProps {
    title: string;
    description: string;
    activeTab: 'privacy' | 'terms' | 'dmca' | 'cookies';
    categories?: Record<string, PublicCategorySummary>;
    children: ReactNode;
}

const navItems = [
    {
        id: 'terms',
        title: 'Términos de Servicio',
        href: '/terminos',
        icon: FileText,
    },
    {
        id: 'privacy',
        title: 'Política de Privacidad',
        href: '/privacidad',
        icon: Shield,
    },
    {
        id: 'dmca',
        title: 'Derechos de Autor (DMCA)',
        href: '/dmca',
        icon: Scale,
    },
    {
        id: 'cookies',
        title: 'Política de Cookies',
        href: '/cookies',
        icon: Cookie,
    },
] as const;

export function LegalLayout({
    title,
    description,
    activeTab,
    categories,
    children,
}: LegalLayoutProps) {
    return (
        <PublicLayout categories={categories}>
            <Head title={`${title} - KawaiiNews`} />

            <div className="mb-6 flex items-center justify-between">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>
                        <span className="sm:hidden">Volver</span>
                        <span className="hidden sm:inline">Volver a la portada</span>
                    </span>
                </Link>
            </div>

            <div className="mb-8 overflow-hidden rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-xs sm:p-8 dark:border-neutral-800/80 dark:bg-neutral-900/50">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:border-rose-400/20 dark:bg-rose-500/15 dark:text-rose-400">
                            <span>Información Legal y Transparencia</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl dark:text-white">
                            {title}
                        </h1>
                        <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                            {description}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-3 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300">
                        <Mail className="h-4 w-4 text-rose-500 shrink-0" />
                        <div>
                            <span className="block font-medium">Contacto legal</span>
                            <a
                                href="mailto:legal@kawaiinews.com"
                                className="font-semibold text-rose-600 hover:underline dark:text-rose-400"
                            >
                                legal@kawaiinews.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <nav aria-label="Navegación legal" className="lg:col-span-3">
                    <div className="sticky top-28 space-y-1.5 rounded-3xl border border-neutral-200/80 bg-white p-3 shadow-xs dark:border-neutral-800/80 dark:bg-neutral-900/50">
                        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                            Documentos
                        </div>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                                        isActive
                                            ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                                            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-white'
                                    }`}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    <span>{item.title}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                <main className="lg:col-span-9">
                    <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-xs sm:p-10 dark:border-neutral-800/80 dark:bg-neutral-900/50">
                        {children}
                    </div>
                </main>
            </div>
        </PublicLayout>
    );
}
