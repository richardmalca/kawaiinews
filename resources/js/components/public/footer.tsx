import { Link } from '@inertiajs/react';
import { Heart, Sparkles } from 'lucide-react';

export function PublicFooter() {
    return (
        <footer className="border-t border-neutral-200 bg-white text-xs text-neutral-600 dark:border-neutral-900 dark:bg-neutral-950 dark:text-neutral-400">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white shadow-sm">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-neutral-950 dark:text-white">
                                Kawaii
                                <span className="text-rose-500">News</span>
                            </span>
                        </div>
                        <p className="max-w-sm text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                            Tu portal de noticias sobre anime, manga, gaming y
                            cultura geek. Cobertura de las principales fuentes
                            internacionales y redacción editorial en español.
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-3 text-xs font-bold tracking-wider text-neutral-900 uppercase dark:text-neutral-200">
                            Secciones
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <Link
                                    href="/?categoria=anime"
                                    className="transition-colors hover:text-rose-500 dark:hover:text-rose-400"
                                >
                                    Anime & Animación
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/?categoria=manga"
                                    className="transition-colors hover:text-rose-500 dark:hover:text-rose-400"
                                >
                                    Manga & Novelas Ligeras
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/?categoria=gaming"
                                    className="transition-colors hover:text-rose-500 dark:hover:text-rose-400"
                                >
                                    Videojuegos & Esports
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/?categoria=geek"
                                    className="transition-colors hover:text-rose-500 dark:hover:text-rose-400"
                                >
                                    Tecnología & Geek
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-3 text-xs font-bold tracking-wider text-neutral-900 uppercase dark:text-neutral-200">
                            Ecosistema
                        </h4>
                        <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                            Lo último en lanzamientos, estrenos, trailers y
                            actualidad sobre el mundo del entretenimiento
                            japonés y los videojuegos.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 border-t border-neutral-200/80 pt-8 sm:flex-row dark:border-neutral-900/80">
                    <p>
                        © {new Date().getFullYear()} KawaiiNews. Todos los
                        derechos reservados.
                    </p>
                    <div className="flex items-center gap-1">
                        <span>Hecho con</span>
                        <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                        <span>para la comunidad</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
