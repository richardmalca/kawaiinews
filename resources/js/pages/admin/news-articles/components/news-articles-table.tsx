import { Link } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
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
                        <TableCell className="max-w-xs truncate font-medium">
                            {article.title}
                        </TableCell>
                        <TableCell className="capitalize">
                            {article.category}
                        </TableCell>
                        <TableCell>
                            <NewsArticleStatusBadge status={article.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {article.created_at}
                        </TableCell>
                        <TableCell className="flex justify-end gap-1">
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
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
