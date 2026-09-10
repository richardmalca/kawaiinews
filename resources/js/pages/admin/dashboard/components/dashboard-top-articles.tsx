import { Eye, Heart, MessagesSquare, Share2, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { DashboardTopArticle } from '@/types/admin';

type Props = {
    articles: DashboardTopArticle[];
};

export default function DashboardTopArticles({ articles }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Noticias con más vistas</CardTitle>
                <CardDescription>
                    Las más leídas, con sus reacciones y compartidos
                </CardDescription>
            </CardHeader>
            <CardContent>
                {articles.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        Todavía no hay noticias publicadas.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Noticia</TableHead>
                                    <TableHead className="text-right">
                                        <Eye className="ml-auto h-4 w-4" />
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <Heart className="ml-auto h-4 w-4" />
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <Star className="ml-auto h-4 w-4" />
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <Share2 className="ml-auto h-4 w-4" />
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <MessagesSquare className="ml-auto h-4 w-4" />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {articles.map((article) => (
                                    <TableRow key={article.id}>
                                        <TableCell className="max-w-xs">
                                            <p
                                                className="truncate font-medium"
                                                title={article.title}
                                            >
                                                {article.title}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className="mt-1 capitalize"
                                            >
                                                {article.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {article.views}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {article.likes}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {article.favorites}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {article.shares}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {article.comments}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
