import { MessageSquare, MessagesSquare, Sparkles } from 'lucide-react';
import type { PublicComment } from '@/types';
import { useArticleComments } from '../../hooks/use-article-comments';
import { ArticleCommentForm } from './article-comment-form';
import { ArticleCommentItem } from './article-comment-item';

interface ArticleCommentsSectionProps {
    articleSlug: string;
    onRequireAuth: () => void;
}

export function ArticleCommentsSection({ articleSlug, onRequireAuth }: ArticleCommentsSectionProps) {
    const {
        comments,
        totalComments,
        isLoading,
        isLoadingMore,
        isSubmitting,
        hasMore,
        replyingTo,
        setReplyingTo,
        loadMore,
        addComment,
        updateComment,
        deleteComment,
        toggleLikeComment,
    } = useArticleComments({
        articleSlug,
        onRequireAuth,
    });

    return (
        <section id="comentarios" className="mt-12 scroll-mt-24 border-t border-neutral-200/80 pt-8 dark:border-neutral-800/80">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                        <MessagesSquare className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-neutral-950 sm:text-lg dark:text-white">
                            Comentarios
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {totalComments} {totalComments === 1 ? 'comentario' : 'comentarios'} en esta noticia
                        </p>
                    </div>
                </div>
            </div>

            {/* Root Comment Form */}
            <div className="mb-8">
                <ArticleCommentForm
                    isSubmitting={isSubmitting}
                    onSubmit={addComment}
                    onRequireAuth={onRequireAuth}
                />
            </div>

            {/* Comments List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="flex animate-pulse items-start gap-3">
                            <div className="h-9 w-9 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                            <div className="flex-1 space-y-2 rounded-2xl border border-neutral-200/60 p-4 dark:border-neutral-800/60">
                                <div className="h-3.5 w-1/4 rounded bg-neutral-200 dark:bg-neutral-800" />
                                <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
                                <div className="h-3 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : comments.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-neutral-200/80 p-8 text-center sm:p-12 dark:border-neutral-800/80">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        Sé el primero en comentar
                    </h4>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        Comparte tus opiniones o teorías sobre esta noticia con la comunidad.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {comments.map((comment) => (
                        <div key={comment.id} className="space-y-3">
                            {/* Root Comment */}
                            <ArticleCommentItem
                                comment={comment}
                                isReply={false}
                                replyingCommentId={replyingTo?.id}
                                isSubmitting={isSubmitting}
                                onReplyClick={(c) => setReplyingTo(c)}
                                onCancelReply={() => setReplyingTo(null)}
                                onSubmitReply={addComment}
                                onToggleLike={toggleLikeComment}
                                onUpdateComment={updateComment}
                                onDeleteComment={deleteComment}
                                onRequireAuth={onRequireAuth}
                            />

                            {/* Replies (Aplanadas visualmente bajo la raíz) */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="ml-4 sm:ml-8 space-y-2.5">
                                    {comment.replies.map((reply) => (
                                        <ArticleCommentItem
                                            key={reply.id}
                                            comment={reply}
                                            isReply={true}
                                            replyingCommentId={replyingTo?.id}
                                            isSubmitting={isSubmitting}
                                            onReplyClick={(c) => setReplyingTo(c)}
                                            onCancelReply={() => setReplyingTo(null)}
                                            onSubmitReply={addComment}
                                            onToggleLike={toggleLikeComment}
                                            onUpdateComment={updateComment}
                                            onDeleteComment={deleteComment}
                                            onRequireAuth={onRequireAuth}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Load More Button */}
                    {hasMore && (
                        <div className="pt-4 text-center">
                            <button
                                type="button"
                                onClick={loadMore}
                                disabled={isLoadingMore}
                                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200/80 bg-white px-5 py-2 text-xs font-bold text-neutral-700 shadow-2xs transition-all hover:border-neutral-300 hover:bg-neutral-50 active:scale-95 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            >
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span>{isLoadingMore ? 'Cargando más comentarios...' : 'Cargar más comentarios'}</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
