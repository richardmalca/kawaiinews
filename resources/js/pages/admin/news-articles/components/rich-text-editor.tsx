import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { BlockNoteView } from '@blocknote/mantine';
import {
    BasicTextStyleButton,
    BlockTypeSelect,
    ColorStyleButton,
    CreateLinkButton,
    FormattingToolbar,
    FormattingToolbarController,
    NestBlockButton,
    TextAlignButton,
    UnnestBlockButton,
    useCreateBlockNote,
} from '@blocknote/react';
import { useEffect, useRef, useState } from 'react';
import { useAppearance } from '@/hooks/use-appearance';

type Props = {
    value: string;
    onChange: (value: string) => void;
};

/**
 * BlockNote es un editor pensado para correr solo en el navegador (toca
 * `window`/el DOM al armar su estado interno) — renderizarlo durante SSR
 * (la página de edición de artículos ahora pasa por Inertia SSR) tira
 * `window is not defined` y se cae toda la respuesta. Este wrapper no
 * monta nada de BlockNote hasta después del primer render en cliente, así
 * el server nunca intenta ejecutar ese código.
 */
export default function RichTextEditor(props: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="border-input h-48 animate-pulse border bg-muted/40" />;
    }

    return <RichTextEditorClient {...props} />;
}

function RichTextEditorClient({ value, onChange }: Props) {
    const editor = useCreateBlockNote();
    const isLoadingInitialContent = useRef(true);
    const { resolvedAppearance } = useAppearance();

    useEffect(() => {
        if (value) {
            const blocks = editor.tryParseHTMLToBlocks(value);
            editor.replaceBlocks(editor.document, blocks);
        }

        isLoadingInitialContent.current = false;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = () => {
        if (isLoadingInitialContent.current) {
            return;
        }

        const html = editor.blocksToFullHTML(editor.document);
        onChange(html);
    };

    return (
        <div className="border-input border">
            <BlockNoteView
                editor={editor}
                theme={resolvedAppearance}
                onChange={handleChange}
                formattingToolbar={false}
            >
                <FormattingToolbarController
                    formattingToolbar={() => (
                        <FormattingToolbar>
                            <BlockTypeSelect key="blockTypeSelect" />
                            <BasicTextStyleButton
                                basicTextStyle="bold"
                                key="boldStyleButton"
                            />
                            <BasicTextStyleButton
                                basicTextStyle="italic"
                                key="italicStyleButton"
                            />
                            {/* Sin botón de subrayado a propósito: en una
                                página web el subrayado se lee como link, no
                                como énfasis — para eso está negrita/cursiva.
                                Mismo criterio que el prompt de redacción con
                                IA (NewsArticleService). */}
                            <BasicTextStyleButton
                                basicTextStyle="strike"
                                key="strikeStyleButton"
                            />
                            <TextAlignButton
                                textAlignment="left"
                                key="textAlignLeftButton"
                            />
                            <TextAlignButton
                                textAlignment="center"
                                key="textAlignCenterButton"
                            />
                            <TextAlignButton
                                textAlignment="right"
                                key="textAlignRightButton"
                            />
                            <ColorStyleButton key="colorStyleButton" />
                            <NestBlockButton key="nestBlockButton" />
                            <UnnestBlockButton key="unnestBlockButton" />
                            <CreateLinkButton key="createLinkButton" />
                        </FormattingToolbar>
                    )}
                />
            </BlockNoteView>
        </div>
    );
}
