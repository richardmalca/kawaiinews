interface ArticleContentProps {
    body: string | null;
    fontSize?: 'sm' | 'base' | 'lg';
}

const fontSizeClasses = {
    sm: 'text-sm [&_p]:text-[15px] [&_p]:leading-[1.7] [&_li]:text-[15px] [&_.bn-inline-content]:text-[15px]',
    base: 'text-base [&_p]:text-[17px] [&_p]:leading-[1.8] [&_li]:text-[17px] [&_.bn-inline-content]:text-[17px]',
    lg: 'text-lg [&_p]:text-[19px] [&_p]:leading-[1.85] [&_li]:text-[19px] [&_.bn-inline-content]:text-[19px]',
};

export function ArticleContent({
    body,
    fontSize = 'base',
}: ArticleContentProps) {
    if (!body) {
        return (
            <div className="py-8 text-neutral-500">
                <p>Contenido no disponible.</p>
            </div>
        );
    }

    return (
        <div
            id="article-content-body"
            className={`prose prose-neutral dark:prose-invert max-w-none text-neutral-800 transition-colors dark:text-neutral-200 [&_.aspect-video]:my-8 [&_.aspect-video]:w-full [&_.aspect-video]:overflow-hidden [&_.aspect-video]:rounded-2xl [&_.aspect-video]:shadow-sm [&_.bn-block-outer]:my-4 [&_.bn-inline-content]:leading-[1.8] [&_.bn-inline-content]:leading-relaxed [&_a]:text-rose-600 hover:[&_a]:underline dark:[&_a]:text-rose-400 [&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-rose-500/80 [&_blockquote]:pl-5 [&_blockquote]:text-neutral-700 [&_blockquote]:italic dark:[&_blockquote]:text-neutral-300 [&_em]:italic [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-neutral-950 dark:[&_h2]:text-white [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:tracking-tight [&_h3]:text-neutral-950 dark:[&_h3]:text-white [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:rounded-2xl [&_iframe]:border [&_iframe]:border-neutral-200/80 dark:[&_iframe]:border-neutral-800/80 [&_img]:my-8 [&_img]:rounded-2xl [&_img]:border [&_img]:border-neutral-200/80 dark:[&_img]:border-neutral-800/80 [&_li]:leading-[1.75] [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:space-y-2.5 [&_ol]:pl-6 [&_p]:my-6 [&_p]:leading-relaxed [&_p]:tracking-normal [&_strong]:font-semibold [&_strong]:text-neutral-950 dark:[&_strong]:text-white [&_u]:underline [&_u]:decoration-rose-500/50 [&_u]:decoration-2 [&_u]:underline-offset-4 [&_ul]:my-6 [&_ul]:list-disc [&_ul]:space-y-2.5 [&_ul]:pl-6 ${fontSizeClasses[fontSize]}`}
            dangerouslySetInnerHTML={{ __html: body }}
        />
    );
}
