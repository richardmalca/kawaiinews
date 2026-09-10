import type { PublicCategorySummary } from '@/types';
import { LegalLayout } from './legal-layout';

interface LegalProps {
    categories?: Record<string, PublicCategorySummary>;
}

export default function TermsPage({ categories }: LegalProps) {
    return (
        <LegalLayout
            title="Términos de Servicio"
            description="Reglas claras y sencillas para convivir en comunidad y disfrutar de las noticias en KawaiiNews."
            activeTab="terms"
            categories={categories}
        >
            <div className="prose prose-neutral dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-6 text-neutral-700 dark:text-neutral-300">
                <section className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                        1. Aceptación de las condiciones
                    </h2>
                    <p>
                        Al navegar en KawaiiNews, leer nuestras publicaciones o participar comentando, aceptas estos términos básicos de uso. Buscamos que este sea un espacio agradable, amigable y divertido para los amantes del anime, manga y los videojuegos.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                        2. Reglas de la comunidad y comentarios
                    </h2>
                    <p>
                        Para mantener una comunidad sana, te pedimos respetar las siguientes pautas al opinar o interactuar:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong>Respeto mutuo:</strong> No se permiten insultos, ataques personales, discriminación, acoso ni incitaciones al odio.
                        </li>
                        <li>
                            <strong>Cero Spam:</strong> No publiques enlaces comerciales, publicidad invasiva ni mensajes repetitivos.
                        </li>
                        <li>
                            <strong>Protección contra Spoilers:</strong> Si vas a revelar giros importantes de una serie, película o manga que puedan arruinarle la sorpresa a otros lectores, debes marcar obligatoriamente la casilla de "Spoiler" al enviar tu comentario.
                        </li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                        3. Naturaleza del contenido editorial
                    </h2>
                    <p>
                        Las noticias que publicamos en KawaiiNews son elaboradas, redactadas o curadas a partir de fuentes informativas y notas de prensa de Japón, Estados Unidos y el mundo. Siempre procuramos citar las fuentes originales correspondientes con respeto y rigor editorial.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                        4. Cuentas y moderación
                    </h2>
                    <p>
                        Nos reservamos el derecho de moderar, ocultar o eliminar comentarios que violen estas normas, así como suspender o restringir el acceso a cuentas que incurran de manera reiterada en spam, insultos o actividades maliciosas.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                        5. Limitación de responsabilidad
                    </h2>
                    <p>
                        Trabajamos constantemente para que la información esté actualizada y el sitio funcione de manera ininterrumpida; sin embargo, no nos hacemos responsables por fallos temporales en servidores de terceros ni por las opiniones expresadas individualmente por los usuarios en los comentarios.
                    </p>
                </section>
            </div>
        </LegalLayout>
    );
}
