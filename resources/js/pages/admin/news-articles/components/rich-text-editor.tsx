import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
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
            />
        </div>
    );
}
