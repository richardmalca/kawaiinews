import { Link } from '@inertiajs/react';
import { ImageOff, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import DeleteNewsArticleDialog from '@/pages/admin/news-articles/components/delete-news-article-dialog';
import NewsArticleStatusToggleCell from '@/pages/admin/news-articles/components/news-article-status-toggle-cell';
import { edit } from '@/routes/admin/news-articles';
import type { NewsArticle } from '@/types/admin';

type Props = {
    articles: NewsArticle[];
};

function ArticleThumbnail({ article }: { article: NewsArticle }) {
    return article.featured_image ? (
        <img
            src={article.featured_image}
            alt=""
            className="border-input h-14 w-14 shrink-0 rounded-md border object-cover sm:h-16 sm:w-16"
        />
    ) : (
        <div className="bg-muted text-muted-foreground border-input flex h-14 w-14 shrink-0 items-center justify-center rounded-md border sm:h-16 sm:w-16">
            <ImageOff className="h-5 w-5" />
        </div>
    );
}

export default function NewsArticlesTable({ articles }: Props) {
    if (articles.length === 0) {
        return (
            <p className="text-muted-foreground text-sm">
                Todavía no hay noticias. Acepta algún tema desde la bandeja de
                revisión para crear tu primer borrador.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-20"></TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead className="hidden md:table-cell">
                            Categoría
                        </TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="hidden sm:table-cell">
                            Creada
                        </TableHead>
                        <TableHead className="text-right">
                            Acciones
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {articles.map((article) => (
                        <TableRow key={article.id}>
                            <TableCell className="py-2">
                                <ArticleThumbnail article={article} />
                            </TableCell>
                            <TableCell className="max-w-40 py-2 font-medium sm:max-w-xs">
                                <p className="line-clamp-2">
                                    {article.title}
                                </p>
                                {/* En mobile Categoría/Creada están
                                    ocultas: las mostramos acá abajo para no
                                    perder el contexto. */}
                                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs md:hidden">
                                    <Badge
                                        variant="outline"
                                        className="capitalize"
                                    >
                                        {article.category}
                                    </Badge>
                                    <span className="sm:hidden">
                                        {article.created_at}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="hidden py-2 capitalize md:table-cell">
                                {article.category}
                            </TableCell>
                            <TableCell className="py-2">
                                <NewsArticleStatusToggleCell
                                    article={article}
                                />
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden py-2 text-xs whitespace-nowrap sm:table-cell">
                                {article.created_at}
                            </TableCell>
                            <TableCell className="py-2">
                                <div className="flex justify-end gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                    >
                                        <Link href={edit(article.id).url}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">
                                                Editar
                                            </span>
                                        </Link>
                                    </Button>
                                    <DeleteNewsArticleDialog
                                        article={article}
                                    />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
