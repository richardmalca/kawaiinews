import { useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    CornerDownRight,
    Edit2,
    Eye,
    EyeOff,
    Heart,
    MessageCircle,
    MoreHorizontal,
    Trash2,
} from 'lucide-react';
import type { PublicComment } from '@/types';
import { ArticleCommentForm } from './article-comment-form';

interface ArticleCommentItemProps {
    comment: PublicComment;
    isReply?: boolean;
    replyingCommentId?: number | null;
    isSubmitting?: boolean;
    onReplyClick: (comment: PublicComment) => void;
    onCancelReply: () => void;
    onSubmitReply: (data: { body: string; replyToCommentId?: number | null; isSpoiler: boolean }) => Promise<boolean>;
    onToggleLike: (commentId: number) => void;
    onUpdateComment: (commentId: number, data: { body: string; isSpoiler?: boolean }) => Promise<boolean>;
    onDeleteComment: (commentId: number, isRoot: boolean) => Promise<boolean>;
    onRequireAuth: () => void;
}

export function ArticleCommentItem({
    comment,
    isReply = false,
    replyingCommentId,
    isSubmitting,
    onReplyClick,
    onCancelReply,
    onSubmitReply,
    onToggleLike,
    onUpdateComment,
    onDeleteComment,
    onRequireAuth,
}: ArticleCommentItemProps) {
    const [revealedSpoiler, setRevealedSpoiler] = useState(!comment.is_spoiler);
    const [isEditing, setIsEditing] = useState(false);
    const [editBody, setEditBody] = useState(comment.body);
    const [editSpoiler, setEditSpoiler] = useState(comment.is_spoiler);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const isThisReplying = replyingCommentId === comment.id;

    const handleSaveEdit = async () => {
        if (!editBody.trim() || isSavingEdit) {
            return;
        }
        setIsSavingEdit(true);
        const success = await onUpdateComment(comment.id, {
            body: editBody.trim(),
            isSpoiler: editSpoiler,
        });
        setIsSavingEdit(false);
        if (success) {
            setIsEditing(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('¿Seguro que deseas eliminar este comentario?')) {
            await onDeleteComment(comment.id, !isReply);
        }
    };

    const author = comment.user;
    const authorName = author?.name ?? 'Usuario anónimo';
    const authorUsername = author?.username ?? '';
    const authorAvatar = author?.avatar;

    return (
        <div className={`group relative transition-colors ${isReply ? 'mt-3 pl-3 sm:pl-4 border-l-2 border-rose-100 dark:border-rose-950/60' : ''}`}>
            <div className="flex items-start gap-2.5 sm:gap-3">
                {/* Avatar */}
                <div className="shrink-0">
                    {authorUsername ? (
                        <Link href={`/perfil/${authorUsername}`} className="block transition-transform hover:scale-105">
                            {authorAvatar ? (
                                <img
                                    src={authorAvatar}
                                    alt={authorName}
                                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-800"
                                />
                            ) : (
                                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-rose-100 font-bold text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                    {authorName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </Link>
                    ) : (
                        <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-neutral-200 font-bold text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                            {authorName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Content Box */}
                <div className="min-w-0 flex-1">
                    <div className="rounded-2xl border border-neutral-200/70 bg-white/70 p-3 sm:p-3.5 shadow-2xs backdrop-blur-xs dark:border-neutral-800/70 dark:bg-neutral-900/40">
                        {/* Header: Author & Meta */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                {authorUsername ? (
                                    <Link
                                        href={`/perfil/${authorUsername}`}
                                        className="font-bold text-neutral-900 hover:text-rose-600 dark:text-neutral-100 dark:hover:text-rose-400"
                                    >
                                        {authorName}
                                    </Link>
                                ) : (
                                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                                        {authorName}
                                    </span>
                                )}

                                {authorUsername && (
                                    <span className="hidden text-[11px] text-neutral-400 sm:inline">
                                        @{authorUsername}
                                    </span>
                                )}

                                {/* Etiqueta de respuesta solo si responde a OTRA respuesta (no al comentario raíz) */}
                                {comment.reply_to && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                                        <CornerDownRight className="h-3 w-3 text-neutral-400" />
                                        <span className="text-neutral-400">a</span>
                                        <Link
                                            href={`/perfil/${comment.reply_to.username}`}
                                            className="font-semibold text-rose-600 hover:underline dark:text-rose-400"
                                        >
                                            @{comment.reply_to.username}
                                        </Link>
                                    </span>
                                )}

                                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                                <span className="text-[11px] text-neutral-400" title={comment.created_at_iso}>
                                    {comment.created_at ?? 'hace un momento'}
                                </span>

                                {comment.is_edited && (
                                    <span className="text-[10px] text-neutral-400 italic">
                                        (editado)
                                    </span>
                                )}
                            </div>

                            {/* Dropdown / Actions for author or staff */}
                            {(comment.can_update || comment.can_delete) && (
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowMenu(!showMenu)}
                                        className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                                        title="Opciones"
                                    >
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                    </button>

                                    {showMenu && (
                                        <div
                                            className="absolute right-0 top-6 z-20 w-32 rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
                                            onMouseLeave={() => setShowMenu(false)}
                                        >
                                            {comment.can_update && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowMenu(false);
                                                        setIsEditing(true);
                                                    }}
                                                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                    Editar
                                                </button>
                                            )}
                                            {comment.can_delete && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowMenu(false);
                                                        handleDelete();
                                                    }}
                                                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Body / Edit Form */}
                        {isEditing ? (
                            <div className="mt-2 space-y-2">
                                <textarea
                                    value={editBody}
                                    onChange={(e) => setEditBody(e.target.value)}
                                    rows={2}
                                    className="w-full resize-none rounded-xl border border-neutral-200 bg-white p-2 text-xs focus:border-rose-400 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                />
                                <div className="flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditSpoiler(!editSpoiler)}
                                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium ${
                                            editSpoiler
                                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                        }`}
                                    >
                                        {editSpoiler ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                        Spoiler
                                    </button>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="rounded-lg px-2.5 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveEdit}
                                            disabled={isSavingEdit || !editBody.trim()}
                                            className="rounded-lg bg-neutral-900 px-3 py-1 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-1.5 text-xs sm:text-sm text-neutral-800 dark:text-neutral-200">
                                {comment.is_spoiler && !revealedSpoiler ? (
                                    <div className="relative overflow-hidden rounded-xl border border-amber-200/60 bg-amber-50/50 p-2.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                                        <div className="blur-xs select-none">
                                            {comment.body}
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-900/80">
                                            <button
                                                type="button"
                                                onClick={() => setRevealedSpoiler(true)}
                                                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-800 transition-transform hover:scale-105 dark:bg-amber-500/25 dark:text-amber-200"
                                            >
                                                <EyeOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                                Mostrar spoiler
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap leading-relaxed break-words">
                                        {comment.body}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Footer Interactions (Like & Reply buttons) */}
                        <div className="mt-2.5 flex items-center gap-3 border-t border-neutral-100/80 pt-2 dark:border-neutral-800/50">
                            <button
                                type="button"
                                onClick={() => onToggleLike(comment.id)}
                                className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
                                    comment.has_liked
                                        ? 'text-rose-600 dark:text-rose-400'
                                        : 'text-neutral-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400'
                                }`}
                                title="Me gusta"
                            >
                                <Heart
                                    className={`h-3.5 w-3.5 ${comment.has_liked ? 'fill-current text-rose-500' : ''}`}
                                />
                                <span>{comment.likes_count > 0 ? comment.likes_count : ''}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => onReplyClick(comment)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                                title="Responder a este comentario"
                            >
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span>Responder</span>
                            </button>
                        </div>
                    </div>

                    {/* Inline Reply Form if triggered for this specific comment */}
                    {isThisReplying && (
                        <div className="mt-2.5">
                            <ArticleCommentForm
                                replyingTo={comment}
                                autoFocus
                                isSubmitting={isSubmitting}
                                onCancelReply={onCancelReply}
                                onSubmit={onSubmitReply}
                                onRequireAuth={onRequireAuth}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
