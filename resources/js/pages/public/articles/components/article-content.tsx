interface ArticleContentProps {
    body: string | null;
}

export function ArticleContent({ body }: ArticleContentProps) {
    if (!body) {
        return (
            <div className="py-8 text-neutral-500">
                <p>Contenido no disponible.</p>
            </div>
        );
    }

    return (
        <div
            className="prose prose-neutral dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200 [&_a]:text-rose-600 hover:[&_a]:underline dark:[&_a]:text-rose-400 [&_img]:my-8 [&_img]:rounded-2xl [&_img]:border [&_img]:border-neutral-200/80 dark:[&_img]:border-neutral-800/80 [&>blockquote]:my-8 [&>blockquote]:border-l-4 [&>blockquote]:border-rose-500/80 [&>blockquote]:pl-5 [&>blockquote]:text-neutral-700 [&>blockquote]:italic dark:[&>blockquote]:text-neutral-300 [&>em]:italic [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:text-2xl [&>h2]:font-extrabold [&>h2]:tracking-tight [&>h2]:text-neutral-950 dark:[&>h2]:text-white [&>h3]:mt-8 [&>h3]:mb-3 [&>h3]:text-xl [&>h3]:font-bold [&>h3]:tracking-tight [&>h3]:text-neutral-950 dark:[&>h3]:text-white [&>li]:text-[17px] [&>li]:leading-[1.75] [&>ol]:my-6 [&>ol]:list-decimal [&>ol]:space-y-2.5 [&>ol]:pl-6 [&>p]:my-6 [&>p]:text-[17px] [&>p]:leading-[1.8] [&>p]:tracking-normal [&>strong]:font-semibold [&>strong]:text-neutral-950 dark:[&>strong]:text-white [&>u]:underline [&>u]:decoration-rose-500/50 [&>u]:decoration-2 [&>u]:underline-offset-4 [&>ul]:my-6 [&>ul]:list-disc [&>ul]:space-y-2.5 [&>ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: body }}
        />
    );
}
