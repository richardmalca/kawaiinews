type Props = {
    title: string;
    description: string;
    url: string;
    faviconUrl: string | null;
};

// Los cortes de Google son aproximados (varían según ancho de pantalla y
// caracteres), pero ~60 y ~155 son las referencias más usadas para avisar
// "esto se puede llegar a cortar" sin pretender ser exactos al pixel.
const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 155;

export default function GoogleSerpPreview({
    title: titleProp,
    description,
    url,
    faviconUrl,
}: Props) {
    const displayUrl = url.replace(/^https?:\/\//, '');
    const title = titleProp || 'Título del sitio';
    const desc =
        description ||
        'Agregá una descripción para que Google la muestre acá debajo del título.';

    return (
        <div className="max-w-xl rounded-lg border bg-white p-4 font-sans dark:bg-neutral-900">
            <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                    {faviconUrl ? (
                        <img
                            src={faviconUrl}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="text-xs">🌐</span>
                    )}
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm text-neutral-800 dark:text-neutral-200">
                        {displayUrl}
                    </p>
                </div>
            </div>
            <p className="mt-1 truncate text-xl text-[#1a0dab] dark:text-[#8ab4f8]">
                {title}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                {desc}
            </p>

            <div className="text-muted-foreground mt-3 flex gap-4 border-t pt-2 text-xs">
                <span
                    className={
                        title.length > TITLE_LIMIT ? 'text-amber-600' : ''
                    }
                >
                    Título: {title.length}/{TITLE_LIMIT}
                </span>
                <span
                    className={
                        desc.length > DESCRIPTION_LIMIT
                            ? 'text-amber-600'
                            : ''
                    }
                >
                    Descripción: {desc.length}/{DESCRIPTION_LIMIT}
                </span>
            </div>
        </div>
    );
}
