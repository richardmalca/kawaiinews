import { Link } from '@inertiajs/react';
import {
    Ban,
    Check,
    CornerDownRight,
    EyeOff,
    Heart,
    ShieldAlert,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
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
import { useApproveComment } from '@/pages/admin/comments/hooks/use-approve-comment';
import type { AdminComment } from '@/types/admin';

type Props = {
    comments: AdminComment[];
};

function CommentRow({ comment }: { comment: AdminComment }) {
    const getInitials = useInitials();
    const { approveComment, processing } = useApproveComment();
    const isPending = comment.status === 'pending';
    const isBlocked = comment.status === 'blocked';

    return (
        <TableRow
            className={
                isBlocked
                    ? 'bg-destructive/5'
                    : isPending
                      ? 'bg-amber-500/5'
                      : undefined
            }
        >
            <TableCell>
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage
                            src={comment.user?.avatar ?? undefined}
                            alt={comment.user?.name ?? '?'}
                        />
                        <AvatarFallback className="bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                            {comment.user
                                ? getInitials(comment.user.name)
                                : '?'}
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
            </TableCell>
            <TableCell className="max-w-56 sm:max-w-xs">
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
                    {isBlocked && (
                        <Badge
                            variant="destructive"
                            className="shrink-0 gap-1"
                            title={`Bloqueado por IA: ${comment.moderation_reason}. Se muestra al público como "Comentario no permitido".`}
                        >
                            <Ban className="h-3 w-3" />
                            <span className="hidden sm:inline">
                                Bloqueado: {comment.moderation_reason}
                            </span>
                        </Badge>
                    )}
                    {isPending && (
                        <Badge
                            variant="outline"
                            className="shrink-0 gap-1 border-amber-500 text-amber-600 dark:text-amber-400"
                            title="Retenido por el filtro automático, todavía sin revisar por IA — no se muestra al público hasta que se resuelva"
                        >
                            <ShieldAlert className="h-3 w-3" />
                            <span className="hidden sm:inline">
                                Pendiente
                            </span>
                        </Badge>
                    )}
                    {comment.is_spoiler && (
                        <Badge variant="destructive" className="shrink-0 gap-1">
                            <EyeOff className="h-3 w-3" />
                            <span className="hidden sm:inline">Spoiler</span>
                        </Badge>
                    )}
                    <p className="line-clamp-2 text-sm break-words">
                        {comment.body}
                    </p>
                </div>
                {/* En mobile la columna Noticia/Fecha están
                    ocultas: las mostramos acá abajo para no
                    perder el contexto. */}
                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs sm:hidden">
                    {comment.article && (
                        <Link
                            href={`/noticias/${comment.article.slug}`}
                            target="_blank"
                            className="line-clamp-1 hover:underline"
                        >
                            {comment.article.title}
                        </Link>
                    )}
                    <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {comment.likes_count}
                    </span>
                    <span>{comment.created_at_formatted}</span>
                </div>
            </TableCell>
            <TableCell className="hidden max-w-48 md:table-cell">
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
                    <span className="text-muted-foreground text-sm">—</span>
                )}
            </TableCell>
            <TableCell className="hidden sm:table-cell">
                <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <Heart className="h-3.5 w-3.5" />
                    {comment.likes_count}
                </span>
            </TableCell>
            <TableCell className="text-muted-foreground hidden text-sm whitespace-nowrap sm:table-cell">
                {comment.created_at_formatted}
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                    {(isPending || isBlocked) && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={processing}
                            onClick={() => approveComment(comment.id)}
                            title="Aprobar: hacerlo visible al público (anula el veredicto si estaba bloqueado)"
                        >
                            {processing ? <Spinner /> : <Check className="h-4 w-4" />}
                            <span className="hidden sm:inline">Aprobar</span>
                        </Button>
                    )}
                    <DeleteCommentDialog comment={comment} />
                </div>
            </TableCell>
        </TableRow>
    );
}

export default function CommentsTable({ comments }: Props) {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Autor</TableHead>
                        <TableHead>Comentario</TableHead>
                        <TableHead className="hidden md:table-cell">
                            Noticia
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">
                            Me gusta
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">
                            Fecha
                        </TableHead>
                        <TableHead className="text-right">
                            Acciones
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {comments.length === 0 && (
                        <TableRow>
                            <TableCell
                                colSpan={6}
                                className="text-muted-foreground text-center"
                            >
                                No hay comentarios que coincidan con el filtro
                            </TableCell>
                        </TableRow>
                    )}

                    {comments.map((comment) => (
                        <CommentRow key={comment.id} comment={comment} />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
