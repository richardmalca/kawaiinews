import { Head, Link } from '@inertiajs/react';
import {
    DollarSign,
    Eye,
    Heart,
    MessagesSquare,
    Newspaper,
    Star,
} from 'lucide-react';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import KpiCard from '@/pages/admin/dashboard/components/kpi-card';
import { edit as editNewsArticle } from '@/routes/admin/news-articles';

type Article = {
    id: number;
    title: string;
    slug: string;
    category: string;
    status: string;
    views: number;
    likes: number;
    favorites: number;
    comments: number;
    published_at: string | null;
};

type Totals = {
    articles: number;
    published: number;
    views: number;
    likes: number;
    favorites: number;
    comments: number;
};

type AiCost = {
    by_kind: Record<
        string,
        {
            calls: number;
            prompt_tokens: number;
            completion_tokens: number;
            estimated_cost_usd: number;
        }
    >;
    total_usd: number;
    has_unknown_pricing: boolean;
};

type Props = {
    articles: Article[];
    totals: Totals;
    aiCost: AiCost;
};

const STATUS_LABELS: Record<string, string> = {
    draft: 'Borrador',
    published: 'Publicada',
    archived: 'Archivada',
};

export default function AuthorStatsIndex({ articles, totals, aiCost }: Props) {
    return (
        <>
            <Head title="Mis noticias" />

            <div className="space-y-6 p-4">
                <Heading
                    title="Mis noticias"
                    description="Cómo les está yendo a las noticias que escribiste, y cuánto gastaste en IA generándolas"
                />

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <KpiCard
                        icon={Newspaper}
                        label="Noticias"
                        value={totals.articles}
                        sublabel={`${totals.published} publicadas`}
                    />
                    <KpiCard
                        icon={Eye}
                        label="Vistas totales"
                        value={totals.views.toLocaleString('es')}
                    />
                    <KpiCard
                        icon={Heart}
                        label="Me gusta + favoritos"
                        value={(totals.likes + totals.favorites).toLocaleString(
                            'es',
                        )}
                    />
                    <KpiCard
                        icon={MessagesSquare}
                        label="Comentarios"
                        value={totals.comments.toLocaleString('es')}
                    />
                </div>

                <div className="border-input rounded-md border p-4">
                    <div className="flex items-center gap-2">
                        <DollarSign className="text-muted-foreground h-4 w-4" />
                        <p className="text-sm font-medium">
                            Gasto estimado de IA en tus noticias
                        </p>
                    </div>
                    <p className="mt-1 text-2xl font-semibold">
                        ${aiCost.total_usd.toFixed(2)}
                    </p>
                    {Object.keys(aiCost.by_kind).length > 0 && (
                        <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                            {Object.entries(aiCost.by_kind).map(
                                ([kind, data]) => (
                                    <span key={kind}>
                                        {kind}: {data.calls} llamada
                                        {data.calls === 1 ? '' : 's'} ($
                                        {data.estimated_cost_usd.toFixed(2)})
                                    </span>
                                ),
                            )}
                        </div>
                    )}
                    {aiCost.has_unknown_pricing && (
                        <p className="text-muted-foreground mt-2 text-xs">
                            Algunos modelos usados no tienen precio cargado
                            todavía, así que el total real puede ser un poco
                            más alto.
                        </p>
                    )}
                </div>

                {articles.length === 0 ? (
                    <Alert>
                        <AlertTitle>Todavía no tenés noticias</AlertTitle>
                        <AlertDescription>
                            Cuando crees o te asignen una noticia, vas a ver
                            acá sus estadísticas.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead className="hidden md:table-cell">
                                        Estado
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <Eye className="ml-auto h-3.5 w-3.5" />
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <Heart className="ml-auto h-3.5 w-3.5" />
                                    </TableHead>
                                    <TableHead className="hidden text-right sm:table-cell">
                                        <Star className="ml-auto h-3.5 w-3.5" />
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <MessagesSquare className="ml-auto h-3.5 w-3.5" />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {articles.map((article) => (
                                    <TableRow key={article.id}>
                                        <TableCell className="max-w-52 py-2 font-medium sm:max-w-sm">
                                            <Link
                                                href={
                                                    editNewsArticle(article.id)
                                                        .url
                                                }
                                                className="line-clamp-2 hover:underline"
                                            >
                                                {article.title}
                                            </Link>
                                            <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs md:hidden">
                                                <Badge variant="outline">
                                                    {STATUS_LABELS[
                                                        article.status
                                                    ] ?? article.status}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden py-2 md:table-cell">
                                            <Badge variant="outline">
                                                {STATUS_LABELS[
                                                    article.status
                                                ] ?? article.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-2 text-right tabular-nums">
                                            {article.views.toLocaleString(
                                                'es',
                                            )}
                                        </TableCell>
                                        <TableCell className="py-2 text-right tabular-nums">
                                            {article.likes}
                                        </TableCell>
                                        <TableCell className="hidden py-2 text-right tabular-nums sm:table-cell">
                                            {article.favorites}
                                        </TableCell>
                                        <TableCell className="py-2 text-right tabular-nums">
                                            {article.comments}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </>
    );
}

AuthorStatsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Mis noticias',
            href: '/admin/my-articles',
        },
    ],
};
