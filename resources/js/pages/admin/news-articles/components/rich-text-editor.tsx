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
import { useEffect, useRef } from 'react';
import { useAppearance } from '@/hooks/use-appearance';

type Props = {
    value: string;
    onChange: (value: string) => void;
};

export default function RichTextEditor({ value, onChange }: Props) {
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
