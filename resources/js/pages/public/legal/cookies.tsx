import type { PublicCategorySummary } from '@/types';
import { LegalLayout } from './legal-layout';

interface LegalProps {
    categories?: Record<string, PublicCategorySummary>;
}

export default function CookiesPage({ categories }: LegalProps) {
    return (
        <LegalLayout
            title="Política de Cookies"
            description="Información clara sobre las cookies y tecnologías que usamos para que la web funcione correctamente."
            activeTab="cookies"
            categories={categories}
        >
            <div className="prose prose-neutral dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-6 text-neutral-700 dark:text-neutral-300">
                <section className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                        1. ¿Qué es una cookie?
                    </h2>
                    <p>
                        Una cookie es un archivo de texto muy pequeño que se almacena en tu navegador cuando visitas una página web. Sirve para recordar cosas básicas, como si tienes la sesión iniciada o si prefieres el tema oscuro o claro.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                        2. ¿Qué tipos de cookies usamos en KawaiiNews?
                    </h2>
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-800/80 dark:bg-neutral-850/50">
                            <h3 className="font-bold text-neutral-900 dark:text-white text-xs sm:text-sm">
                                A. Cookies técnicas y necesarias (Esenciales)
                            </h3>
                            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                                Son imprescindibles para que el sitio funcione. Sin ellas no podrías iniciar sesión ni navegar de forma segura.
                            </p>
                            <ul className="mt-2 list-disc pl-5 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                                <li><strong>Sesión:</strong> Mantiene tu usuario activo mientras navegas.</li>
                                <li><strong>Seguridad (CSRF Token):</strong> Protege tus envíos de formularios y comentarios contra ataques maliciosos.</li>
                                <li><strong>Preferencia visual:</strong> Guarda si elegiste modo oscuro o modo claro.</li>
                            </ul>
                        </div>

                        <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-800/80 dark:bg-neutral-850/50">
                            <h3 className="font-bold text-neutral-900 dark:text-white text-xs sm:text-sm">
                                B. Cookies de publicidad y analítica (Banners no intrusivos)
                            </h3>
                            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                                KawaiiNews es un proyecto independiente y gratuito. Para solventar los costos de servidores, mostramos banners publicitarios no invasivos.
                            </p>
                            <ul className="mt-2 list-disc pl-5 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                                <li>Permiten que los anunciantes muestren anuncios relevantes y eviten mostrarte el mismo anuncio una y otra vez.</li>
                                <li>No recopilan datos personales sensibles como contraseñas o chats.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                        3. ¿Cómo desactivar o borrar las cookies?
                    </h2>
                    <p>
                        Puedes permitir, bloquear o eliminar las cookies instaladas en tu dispositivo configurando las opciones de tu navegador web (Google Chrome, Firefox, Safari, Edge, etc.). Si desactivas las cookies técnicas, es posible que algunas funciones del sitio como el inicio de sesión no operen con normalidad.
                    </p>
                </section>
            </div>
        </LegalLayout>
    );
}
