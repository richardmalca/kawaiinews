import type { PublicCategorySummary } from '@/types';
import { LegalLayout } from './legal-layout';

interface LegalProps {
    categories?: Record<string, PublicCategorySummary>;
}

export default function DmcaPage({ categories }: LegalProps) {
    return (
        <LegalLayout
            title="Derechos de Autor (DMCA)"
            description="Nuestro compromiso con la propiedad intelectual y el procedimiento rápido para solicitar el retiro de contenido protegido."
            activeTab="dmca"
            categories={categories}
        >
            <div className="prose prose-neutral dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-6 text-neutral-700 dark:text-neutral-300">
                <section className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                        1. Respeto a los creadores y derechos de autor
                    </h2>
                    <p>
                        KawaiiNews respeta plenamente los derechos de propiedad intelectual de creadores, estudios de animación, mangakas, ilustradores y editoriales. Nuestro objetivo es promover, difundir y celebrar sus obras mediante cobertura periodística y divulgación cultural.
                    </p>
                    <p>
                        Las imágenes promocionales, capturas, afiches o logotipos utilizados en nuestros artículos se emplean con propósitos informativos, de crítica, reseña y comentario bajo las excepciones legales aplicables (uso legítimo / fair use).
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                        2. ¿Cómo solicitar el retiro de material protegido?
                    </h2>
                    <p>
                        Si eres titular de derechos de autor (o actúas en representación autorizada del titular) y consideras que algún material publicado en nuestro portal infringe tus derechos, por favor ponte en contacto con nosotros. Atendemos cualquier solicitud legítima a la brevedad.
                    </p>
                    <p>
                        Para procesar tu solicitud rápidamente, por favor envíanos un correo a{' '}
                        <a
                            href="mailto:legal@kawaiinews.com"
                            className="font-semibold text-rose-600 underline hover:text-rose-500 dark:text-rose-400"
                        >
                            legal@kawaiinews.com
                        </a>{' '}
                        con los siguientes datos:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            Identificación de la obra protegida por derechos de autor que se alega infringida.
                        </li>
                        <li>
                            El enlace exacto (URL) en KawaiiNews donde se encuentra la imagen, texto o material objeto del reclamo.
                        </li>
                        <li>
                            Tu nombre, empresa u organización y datos de contacto directo (correo electrónico o teléfono).
                        </li>
                        <li>
                            Una declaración breve manifestando de buena fe que el uso del material no está autorizado por el titular de los derechos.
                        </li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                        3. Procedimiento de baja y respuesta
                    </h2>
                    <p>
                        Una vez recibida una notificación válida, nuestro equipo revisará el reclamo y, en caso de corresponder, retirará o reemplazará inmediatamente el material señalado sin demoras injustificadas.
                    </p>
                </section>
            </div>
        </LegalLayout>
    );
}
