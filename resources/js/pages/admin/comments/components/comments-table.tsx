import { Link } from '@inertiajs/react';
import { CornerDownRight, EyeOff, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useInitials } from '@/hooks/use-initials';
import DeleteCommentDialog from '@/pages/admin/comments/components/delete-comment-dialog';
import type { AdminComment } from '@/types/admin';

type Props = {
    comments: AdminComment[];
};

function CommentAuthor({ comment }: { comment: AdminComment }) {
    const getInitials = useInitials();

    return (
        <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage
                    src={comment.user?.avatar ?? undefined}
                    alt={comment.user?.name ?? '?'}
                />
                <AvatarFallback className="bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {comment.user ? getInitials(comment.user.name) : '?'}
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                    {comment.user?.name ?? 'Usuario eliminado'}
                </p>
                {comment.user?.username && (
                    <p className="text-muted-foreground truncate text-xs">
                        @{comment.user.username}
                    </p>
                )}
            </div>
        </div>
    );
}

function CommentBody({ comment }: { comment: AdminComment }) {
    return (
        <>
            {comment.is_reply && (
                <p className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
                    <CornerDownRight className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                        {comment.reply_to
                            ? `Respondiendo a @${comment.reply_to.username ?? comment.reply_to.name}`
                            : 'Respuesta'}
                    </span>
                </p>
            )}
            <div className="flex items-start gap-1.5">
                {comment.is_spoiler && (
                    <Badge variant="destructive" className="shrink-0 gap-1">
                        <EyeOff className="h-3 w-3" />
                        Spoiler
                    </Badge>
                )}
                <p className="line-clamp-2 text-sm break-words">
                    {comment.body}
                </p>
            </div>
        </>
    );
}

function EmptyState() {
    return (
        <p className="text-muted-foreground py-8 text-center text-sm">
            No hay comentarios que coincidan con el filtro
        </p>
    );
}

export default function CommentsTable({ comments }: Props) {
    return (
        <>
            {/* Mobile / tablet: lista de tarjetas, la tabla no entra cómoda
                en pantallas chicas con tanto contenido por fila. */}
            <div className="space-y-3 lg:hidden">
                {comments.length === 0 && <EmptyState />}

                {comments.map((comment) => (
                    <div
                        key={comment.id}
                        className="bg-card space-y-3 rounded-lg border p-3"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <CommentAuthor comment={comment} />
                            <DeleteCommentDialog comment={comment} />
                        </div>

                        <CommentBody comment={comment} />

                        {comment.article && (
                            <Link
                                href={`/noticias/${comment.article.slug}`}
                                target="_blank"
                                className="text-muted-foreground block text-xs hover:underline"
                            >
                                <span className="line-clamp-1">
                                    En: {comment.article.title}
                                </span>
                            </Link>
                        )}

                        <div className="text-muted-foreground flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1">
                                <Heart className="h-3.5 w-3.5" />
                                {comment.likes_count}
                            </span>
                            <span>{comment.created_at_formatted}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop: tabla completa. */}
            <div className="hidden overflow-x-auto lg:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Autor</TableHead>
                            <TableHead>Comentario</TableHead>
                            <TableHead>Noticia</TableHead>
                            <TableHead>Me gusta</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {comments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <EmptyState />
                                </TableCell>
                            </TableRow>
                        )}

                        {comments.map((comment) => (
                            <TableRow key={comment.id}>
                                <TableCell>
                                    <CommentAuthor comment={comment} />
                                </TableCell>
                                <TableCell className="max-w-xs">
                                    <CommentBody comment={comment} />
                                </TableCell>
                                <TableCell className="max-w-48">
                                    {comment.article ? (
                                        <Link
                                            href={`/noticias/${comment.article.slug}`}
                                            target="_blank"
                                            className="text-sm hover:underline"
                                        >
                                            <span className="line-clamp-2">
                                                {comment.article.title}
                                            </span>
                                        </Link>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">
                                            —
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                                        <Heart className="h-3.5 w-3.5" />
                                        {comment.likes_count}
                                    </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                    {comment.created_at_formatted}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DeleteCommentDialog comment={comment} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
