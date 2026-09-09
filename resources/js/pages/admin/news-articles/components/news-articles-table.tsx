import { Link } from '@inertiajs/react';
import { ImageOff, Pencil } from 'lucide-react';
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
import NewsArticleStatusBadge from '@/pages/admin/news-articles/components/news-article-status-badge';
import { edit } from '@/routes/admin/news-articles';
import type { NewsArticle } from '@/types/admin';

type Props = {
    articles: NewsArticle[];
};

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
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {articles.map((article) => (
                    <TableRow key={article.id}>
                        <TableCell className="py-1.5">
                            {article.featured_image ? (
                                <img
                                    src={article.featured_image}
                                    alt=""
                                    className="border-input h-8 w-8 border object-cover"
                                />
                            ) : (
                                <div className="bg-muted text-muted-foreground border-input flex h-8 w-8 items-center justify-center border">
                                    <ImageOff className="h-3.5 w-3.5" />
                                </div>
                            )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate py-1.5 font-medium">
                            {article.title}
                        </TableCell>
                        <TableCell className="py-1.5 capitalize">
                            {article.category}
                        </TableCell>
                        <TableCell className="py-1.5">
                            <NewsArticleStatusBadge status={article.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground py-1.5 text-xs">
                            {article.created_at}
                        </TableCell>
                        <TableCell className="py-1.5">
                            <div className="flex justify-end gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                >
                                    <Link href={edit(article.id).url}>
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Editar</span>
                                    </Link>
                                </Button>
                                <DeleteNewsArticleDialog article={article} />
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
