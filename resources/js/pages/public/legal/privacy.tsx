import { Link, usePage } from '@inertiajs/react';
import type { PublicCategorySummary } from '@/types';
import { LegalLayout } from './legal-layout';

interface LegalProps {
    categories?: Record<string, PublicCategorySummary>;
}

export default function PrivacyPage({ categories }: LegalProps) {
    const { contactEmail } = usePage().props;

    return (
        <LegalLayout
            title="Política de Privacidad"
            description="Te explicamos de forma simple qué información guardamos cuando usas KawaiiNews, para qué la usamos y cómo tienes el control total sobre tu cuenta."
            activeTab="privacy"
            categories={categories}
        >
            <div className="prose prose-neutral dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-6 text-neutral-700 dark:text-neutral-300">
                <section className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                        1. ¿Quiénes somos?
                    </h2>
                    <p>
                        KawaiiNews es un portal informativo en español dedicado a la difusión de noticias sobre anime, manga, videojuegos y cultura geek. Creemos en la transparencia y en no complicar las cosas con letras pequeñas.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                        2. ¿Qué datos recolectamos y por qué?
                    </h2>
                    <p>
                        Solo guardamos la información estrictamente necesaria para que la comunidad funcione:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong>Tu cuenta de usuario:</strong> Si decides iniciar sesión con Google, recibimos tu nombre, correo electrónico y foto de perfil para que puedas comentar y personalizar tu experiencia.
                        </li>
                        <li>
                            <strong>Tus comentarios y favoritos:</strong> Los comentarios que publicas en las noticias y las noticias que guardas como favoritas o que indicas que te gustan.
                        </li>
                        <li>
                            <strong>Dirección IP y datos técnicos mínimos:</strong> Tu IP se usa temporalmente con fines de seguridad: evitar spam en los comentarios, limitar abusos en el sistema (rate limiting) y contabilizar lecturas reales de las noticias.
                        </li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                        3. ¿Con quién se comparten tus datos?
                    </h2>
                    <p>
                        <strong>Nunca vendemos tus datos personales.</strong> Solo interactuamos con servicios externos para lo indispensable:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong>Google:</strong> Para la autenticación segura mediante tu cuenta de Google.
                        </li>
                        <li>
                            <strong>Herramientas de Inteligencia Artificial (Anthropic, OpenAI):</strong> Las usamos internamente como apoyo para redactar, resumir o curar el contenido informativo de las noticias e ilustrar artículos. <em>Bajo ninguna circunstancia enviamos tus datos personales, comentarios ni correos a estos proveedores de IA; solo procesan contenido editorial público.</em>
                        </li>
                        <li>
                            <strong>Publicidad y Google AdSense:</strong> Utilizamos el servicio de publicidad de <strong>Google AdSense</strong> (operado por Google LLC). Google utiliza cookies (como la cookie de DoubleClick o identificadores de publicidad) para publicar anuncios basados en las visitas anteriores de los usuarios a este u otros sitios web. Los usuarios pueden inhabilitar la publicidad personalizada visitando la <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-rose-600 underline hover:text-rose-500 dark:text-rose-400">Configuración de anuncios de Google</a> o consultar cómo gestiona Google los datos en <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="font-semibold text-rose-600 underline hover:text-rose-500 dark:text-rose-400">Política de publicidad de Google</a>.
                        </li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                        4. ¿Cómo borrar tu cuenta y qué ocurre con tus datos?
                    </h2>
                    <p>
                        Tienes derecho a eliminar tu cuenta en cualquier momento, de manera directa e irreversible. Puedes hacerlo desde tus{' '}
                        <Link
                            href="/perfil/ajustes"
                            className="font-semibold text-rose-600 underline hover:text-rose-500 dark:text-rose-400"
                        >
                            Ajustes de Perfil (Zona de peligro)
                        </Link>
                        .
                    </p>
                    <p>
                        <strong>Al confirmar la eliminación:</strong> se borrarán de forma definitiva tu perfil público (@usuario), avatar, banner, correo electrónico, sesiones activas, lista privada de favoritos, reacciones ("me gusta") y comentarios en la comunidad.
                    </p>
                    <p>
                        <strong>Noticias y artículos publicados:</strong> Si eres autor o redactor y has publicado noticias aprobadas en KawaiiNews, dichas notas informativas no se eliminarán del archivo histórico para preservar la integridad periodística del portal; en su lugar, pasarán a estado de borrador o moderación editorial para que el equipo pueda actualizarlas o reescribirlas conforme a nuestros Términos de Servicio.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                        5. Contacto sobre privacidad
                    </h2>
                    <p>
                        Si tienes cualquier duda sobre el tratamiento de tus datos o deseas hacer una consulta específica, puedes escribirnos directamente a nuestro correo:{' '}
                        <a
                            href={`mailto:${contactEmail}`}
                            className="font-semibold text-rose-600 underline hover:text-rose-500 dark:text-rose-400"
                        >
                            {contactEmail}
                        </a>
                        .
                    </p>
                </section>
            </div>
        </LegalLayout>
    );
}
