import type { PublicCategorySummary } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { logout } from '@/routes';
import { dashboard } from '@/routes/admin';
import { LoginDialog } from './login-dialog';
import { openChooseUsernameModal } from '@/lib/username-rules';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Flame,
    Headphones,
    LogOut,
    Menu,
    Newspaper,
    Search,
    Settings,
    Shield,
    Sparkles,
    User,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ThemeToggle } from './theme-toggle';
import {
    SearchSuggestionsDropdown,
    type SearchArticleSuggestion,
    type SearchTagSuggestion,
    type SearchUserSuggestion,
} from './search-suggestions-dropdown';

interface PublicNavbarProps {
    categories?: Record<string, PublicCategorySummary>;
    progress?: number;
}

const privilegedRoles = ['superadmin', 'admin', 'editor'];

export function PublicNavbar({ categories, progress }: PublicNavbarProps) {
    const { auth } = usePage().props;
    const url = usePage().url;
    const isPrivileged = auth.user?.roles.some((role) =>
        privilegedRoles.includes(role),
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [tagSuggestions, setTagSuggestions] = useState<SearchTagSuggestion[]>([]);
    const [userSuggestions, setUserSuggestions] = useState<SearchUserSuggestion[]>([]);
    const [articleSuggestions, setArticleSuggestions] = useState<SearchArticleSuggestion[]>([]);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(e.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const trimmed = searchQuery.trim();
        if (trimmed.length < 2) {
            setTagSuggestions([]);
            setUserSuggestions([]);
            setArticleSuggestions([]);
            setIsDropdownOpen(false);
            return;
        }

        setIsLoadingSuggestions(true);
        setIsDropdownOpen(true);

        const timer = setTimeout(async () => {
            try {
                const response = await fetch(
                    `/buscar/sugerencias?q=${encodeURIComponent(trimmed)}`,
                );
                if (response.ok) {
                    const data = await response.json();
                    setTagSuggestions(data.tags || []);
                    setUserSuggestions(data.users || []);
                    setArticleSuggestions(data.articles || []);
                }
            } catch {
                setTagSuggestions([]);
                setUserSuggestions([]);
                setArticleSuggestions([]);
            } finally {
                setIsLoadingSuggestions(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const categoryEntries = Object.entries(categories ?? {});

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = searchQuery.trim();
        setIsDropdownOpen(false);
        if (trimmed) {
            if (trimmed.startsWith('@') && trimmed.length > 1) {
                const username = trimmed.slice(1);
                router.get(`/perfil/${username}`);
                return;
            }
            if (trimmed.startsWith('#') && trimmed.length > 1) {
                const tagSlug = trimmed.slice(1).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                router.get(`/tag/${tagSlug}`);
                return;
            }
            router.get('/', { q: trimmed });
        } else {
            router.get('/');
        }
    };

    return (
        <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-950/90">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/"
                            className="group flex shrink-0 items-center gap-2"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 shadow-lg shadow-rose-500/20 transition-transform group-hover:scale-105">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <span className="bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 bg-clip-text text-xl font-black tracking-tight text-transparent dark:from-white dark:via-neutral-200 dark:to-neutral-400">
                                Kawaii
                                <span className="text-rose-500">News</span>
                            </span>
                        </Link>

                        <nav className="hidden items-center gap-1 md:flex">
                            <Link
                                href="/"
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    url === '/'
                                        ? 'bg-neutral-100 text-neutral-950 dark:bg-neutral-900 dark:text-white'
                                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white'
                                }`}
                            >
                                <Newspaper className="h-3.5 w-3.5" />
                                <span>Portada</span>
                            </Link>

                            <Link
                                href="/tendencias"
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    url === '/tendencias' ||
                                    url.startsWith('/tendencias')
                                        ? 'bg-neutral-100 text-neutral-950 dark:bg-neutral-900 dark:text-white'
                                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white'
                                }`}
                            >
                                <Flame className="h-3.5 w-3.5 text-amber-500" />
                                <span>Tendencias</span>
                            </Link>

                            <Link
                                href="/feed"
                                target="_blank"
                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
                            >
                                <Headphones className="h-3.5 w-3.5 text-rose-500" />
                                <span>Canal RSS</span>
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        <div ref={searchContainerRef} className="relative hidden items-center sm:flex">
                            <form
                                onSubmit={handleSearchSubmit}
                                className="relative flex items-center"
                            >
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onFocus={() => {
                                        if (searchQuery.trim().length >= 2) {
                                            setIsDropdownOpen(true);
                                        }
                                    }}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar..."
                                    className="h-9 w-44 rounded-xl border border-neutral-200 bg-neutral-100/70 pr-12 pl-8 text-base sm:text-xs text-neutral-800 transition-all placeholder:text-neutral-400 focus:w-64 focus:border-rose-500 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200 dark:focus:border-rose-400 dark:focus:bg-neutral-900"
                                />
                                <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-neutral-400" />
                                <kbd className="pointer-events-none absolute right-2.5 hidden rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 font-mono text-[9px] font-medium text-neutral-400 select-none sm:inline-block dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400">
                                    ⌘K
                                </kbd>
                            </form>

                            {isDropdownOpen && (
                                <SearchSuggestionsDropdown
                                    tags={tagSuggestions}
                                    users={userSuggestions}
                                    articles={articleSuggestions}
                                    isLoading={isLoadingSuggestions}
                                    query={searchQuery}
                                    onSelect={() => {
                                        setIsDropdownOpen(false);
                                        setSearchQuery('');
                                    }}
                                />
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 sm:hidden dark:border-neutral-800 dark:text-neutral-400"
                            aria-label="Buscar"
                        >
                            {isSearchOpen ? (
                                <X className="h-4 w-4" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </button>

                        <ThemeToggle />

                        {/* Menú hamburguesa solo en pantallas móviles (md:hidden) */}
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-950 md:hidden dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white"
                            aria-label="Abrir menú"
                        >
                            <Menu className="h-4 w-4" />
                        </button>

                        {/* En pantallas de escritorio (md:flex), mostrar el botón de perfil o iniciar sesión */}
                        <div className="hidden md:flex items-center">
                            {auth.user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-neutral-100/80 px-2.5 py-1.5 text-xs font-medium text-neutral-800 transition-all hover:border-neutral-300 hover:bg-neutral-200/60 dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:text-neutral-200 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/80"
                                        >
                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-rose-500/10 font-bold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                                                {(auth.user.active_avatar || auth.user.avatar) ? (
                                                    <img
                                                        src={(auth.user.active_avatar || auth.user.avatar) as string}
                                                        alt={auth.user.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    auth.user.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <span className="hidden max-w-[120px] truncate sm:inline-block">
                                                {auth.user.name}
                                            </span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-52 rounded-2xl p-1.5"
                                    >
                                        <div className="px-2 py-1.5">
                                            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                                                {auth.user.name}
                                            </p>
                                            <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                                                {auth.user.email}
                                            </p>
                                        </div>
                                        <DropdownMenuSeparator />
                                        {auth.user.username ? (
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={`/perfil/${auth.user.username}`}
                                                    className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-neutral-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                                >
                                                    <User className="h-3.5 w-3.5 text-rose-500" />
                                                    <span>Mi perfil público</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem asChild>
                                                <button
                                                    type="button"
                                                    onClick={openChooseUsernameModal}
                                                    className="flex w-full cursor-pointer items-center gap-2 rounded-xl bg-amber-500/10 px-2 py-1.5 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400"
                                                >
                                                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                                    <span>Elige tu @usuario</span>
                                                </button>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href="/perfil/mi-cuenta/ajustes"
                                                className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-neutral-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                            >
                                                <Settings className="h-3.5 w-3.5 text-neutral-500" />
                                                <span>Ajustes de cuenta</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        {isPrivileged && (
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={dashboard()}
                                                    className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-neutral-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                                >
                                                    <Shield className="h-3.5 w-3.5 text-rose-500" />
                                                    <span>Panel de Control</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={logout()}
                                                method="post"
                                                as="button"
                                                className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                            >
                                                <LogOut className="h-3.5 w-3.5" />
                                                <span>Cerrar sesión</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsLoginOpen(true)}
                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-100/70 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-all hover:border-neutral-300 hover:bg-neutral-200 hover:text-neutral-950 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-900 dark:hover:text-white"
                                >
                                    <User className="h-3.5 w-3.5" />
                                    <span>Iniciar sesión</span>
                                </button>
                            )}
                        </div>

                        <LoginDialog
                            open={isLoginOpen}
                            onOpenChange={setIsLoginOpen}
                        />

                        {/* Sheet del menú móvil lateral */}
                        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                            <SheetContent side="right" className="w-80 p-0 flex flex-col justify-between">
                                <div className="p-6">
                                    <SheetHeader className="text-left pb-4 border-b border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 shadow-md text-white">
                                                <Sparkles className="h-4 w-4" />
                                            </div>
                                            <SheetTitle className="text-lg font-black tracking-tight">
                                                Kawaii<span className="text-rose-500">News</span>
                                            </SheetTitle>
                                        </div>
                                    </SheetHeader>

                                    {/* Navegación móvil */}
                                    <div className="mt-6 space-y-1">
                                        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                                            Navegación
                                        </p>
                                        <Link
                                            href="/"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                                                url === '/'
                                                    ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                                                    : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900'
                                            }`}
                                        >
                                            <Newspaper className="h-4 w-4 text-rose-500" />
                                            <span>Portada</span>
                                        </Link>

                                        <Link
                                            href="/tendencias"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                                                url.startsWith('/tendencias')
                                                    ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                                                    : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900'
                                            }`}
                                        >
                                            <Flame className="h-4 w-4 text-amber-500" />
                                            <span>Tendencias</span>
                                        </Link>

                                        <Link
                                            href="/feed"
                                            target="_blank"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
                                        >
                                            <Headphones className="h-4 w-4 text-rose-500" />
                                            <span>Canal RSS</span>
                                        </Link>
                                    </div>
                                </div>

                                {/* Sección de usuario / inicio de sesión en el menú móvil */}
                                <div className="border-t border-neutral-200 p-6 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                                    {auth.user ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-rose-500/10 font-bold text-rose-600 dark:border-neutral-800 dark:bg-rose-500/20 dark:text-rose-400">
                                                    {(auth.user.active_avatar || auth.user.avatar) ? (
                                                        <img
                                                            src={(auth.user.active_avatar || auth.user.avatar) as string}
                                                            alt={auth.user.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        auth.user.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                                        {auth.user.name}
                                                    </p>
                                                    <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                                        {auth.user.email}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-1 pt-2">
                                                {auth.user.username ? (
                                                    <Link
                                                        href={`/perfil/${auth.user.username}`}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-white dark:text-neutral-300 dark:hover:bg-neutral-800"
                                                    >
                                                        <User className="h-4 w-4 text-rose-500" />
                                                        <span>Mi perfil público</span>
                                                    </Link>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsMobileMenuOpen(false);
                                                            openChooseUsernameModal();
                                                        }}
                                                        className="flex w-full items-center gap-2.5 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400"
                                                    >
                                                        <Sparkles className="h-4 w-4 text-amber-500" />
                                                        <span>Elige tu @usuario</span>
                                                    </button>
                                                )}

                                                <Link
                                                    href="/perfil/mi-cuenta/ajustes"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-white dark:text-neutral-300 dark:hover:bg-neutral-800"
                                                >
                                                    <Settings className="h-4 w-4 text-neutral-500" />
                                                    <span>Ajustes de cuenta</span>
                                                </Link>

                                                {isPrivileged && (
                                                    <Link
                                                        href={dashboard()}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-white dark:text-neutral-300 dark:hover:bg-neutral-800"
                                                    >
                                                        <Shield className="h-4 w-4 text-rose-500" />
                                                        <span>Panel de Control</span>
                                                    </Link>
                                                )}

                                                <Link
                                                    href={logout()}
                                                    method="post"
                                                    as="button"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    <span>Cerrar sesión</span>
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                setIsLoginOpen(true);
                                            }}
                                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                                        >
                                            <User className="h-4 w-4" />
                                            <span>Iniciar sesión</span>
                                        </button>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>

                {isSearchOpen && (
                    <div className="relative border-t border-neutral-200/80 py-3 sm:hidden dark:border-neutral-800/80">
                        <form
                            onSubmit={handleSearchSubmit}
                            className="relative"
                        >
                            <input
                                type="text"
                                value={searchQuery}
                                onFocus={() => {
                                    if (searchQuery.trim().length >= 2) {
                                        setIsDropdownOpen(true);
                                    }
                                }}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar..."
                                className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-100/80 pr-4 pl-9 text-base text-neutral-800 placeholder:text-neutral-400 focus:border-rose-500 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:border-rose-400"
                                autoFocus
                            />
                            <Search className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-neutral-400" />
                        </form>

                        {isDropdownOpen && (
                            <SearchSuggestionsDropdown
                                tags={tagSuggestions}
                                users={userSuggestions}
                                articles={articleSuggestions}
                                isLoading={isLoadingSuggestions}
                                query={searchQuery}
                                onSelect={() => {
                                    setIsDropdownOpen(false);
                                    setIsSearchOpen(false);
                                    setSearchQuery('');
                                }}
                            />
                        )}
                    </div>
                )}

                {categoryEntries.length > 0 && (
                    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-t border-neutral-200/60 py-2.5 text-xs text-neutral-500 dark:border-neutral-900 dark:text-neutral-400">
                        <span className="pl-1 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                            Categorías:
                        </span>
                        {categoryEntries.map(([slug, data]) => {
                            const isActive =
                                url.startsWith(`/categoria/${slug}`) ||
                                url.includes(`categoria=${slug}`);
                            return (
                                <Link
                                    key={slug}
                                    href={`/categoria/${slug}`}
                                    className={`flex items-center rounded-md border px-2.5 py-1 whitespace-nowrap transition-colors ${
                                        isActive
                                            ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-400'
                                            : 'border-neutral-200 bg-neutral-100/70 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-950 dark:border-neutral-800/60 dark:bg-neutral-900/60 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white'
                                    }`}
                                >
                                    {data.label}
                                    {data.count > 0 && (
                                        <span className="ml-1.5 rounded-full bg-neutral-200 px-1.5 py-0.5 font-mono text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                            {data.count}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {typeof progress === 'number' && (
                <div className="absolute right-0 bottom-0 left-0 h-0.5 overflow-hidden bg-transparent">
                    <div
                        className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 shadow-xs transition-[width] duration-150 ease-out"
                        style={{
                            width: `${Math.max(0, Math.min(100, progress))}%`,
                        }}
                    />
                </div>
            )}
        </header>
    );
}
