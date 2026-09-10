import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Article = { id: number; title: string };

type Props = {
    articles: Article[];
    value: number | null;
    onChange: (articleId: number | null) => void;
};

/**
 * El proyecto no tiene instalado un Combobox/Command de shadcn (solo
 * Select), y un <Select> nativo con decenas/cientos de noticias se ve mal
 * (lista larga sin buscador). Esto es un combobox liviano hecho a mano en
 * vez de sumar una dependencia nueva (cmdk + popover) para un solo filtro.
 */
export default function ArticleFilter({ articles, value, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selected = articles.find((article) => article.id === value);

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();

        if (!term) {
            return articles;
        }

        return articles.filter((article) =>
            article.title.toLowerCase().includes(term),
        );
    }, [articles, query]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        inputRef.current?.focus();

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    return (
        <div ref={containerRef} className="relative w-full sm:w-72">
            <Button
                type="button"
                variant="outline"
                className="w-full justify-between font-normal"
                onClick={() => setOpen((prev) => !prev)}
            >
                <span className="line-clamp-1 text-left">
                    {selected ? selected.title : 'Todas las noticias'}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                    {selected && (
                        <X
                            className="text-muted-foreground hover:text-foreground h-4 w-4"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(null);
                                setQuery('');
                            }}
                        />
                    )}
                    <ChevronsUpDown className="text-muted-foreground h-4 w-4" />
                </span>
            </Button>

            {open && (
                <div className="bg-popover text-popover-foreground absolute z-20 mt-1 w-full rounded-md border shadow-md">
                    <div className="relative border-b p-2">
                        <Search className="text-muted-foreground absolute top-1/2 left-4.5 h-3.5 w-3.5 -translate-y-1/2" />
                        <Input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar noticia..."
                            className="h-8 pl-7 text-sm"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                        <button
                            type="button"
                            className={cn(
                                'hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
                                value === null && 'bg-accent',
                            )}
                            onClick={() => {
                                onChange(null);
                                setOpen(false);
                                setQuery('');
                            }}
                        >
                            <Check
                                className={cn(
                                    'h-4 w-4 shrink-0',
                                    value !== null && 'opacity-0',
                                )}
                            />
                            Todas las noticias
                        </button>

                        {filtered.length === 0 && (
                            <p className="text-muted-foreground px-2 py-3 text-center text-sm">
                                Sin resultados
                            </p>
                        )}

                        {filtered.map((article) => (
                            <button
                                key={article.id}
                                type="button"
                                className={cn(
                                    'hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
                                    value === article.id && 'bg-accent',
                                )}
                                onClick={() => {
                                    onChange(article.id);
                                    setOpen(false);
                                    setQuery('');
                                }}
                            >
                                <Check
                                    className={cn(
                                        'h-4 w-4 shrink-0',
                                        value !== article.id && 'opacity-0',
                                    )}
                                />
                                <span className="line-clamp-1">
                                    {article.title}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
