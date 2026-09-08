import { useRef } from 'react';

type WrapMarker = {
    prefix: string;
    suffix: string;
};

export function useTextFormatting(
    value: string,
    onChange: (value: string) => void,
) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const wrapSelection = ({ prefix, suffix }: WrapMarker) => {
        const textarea = textareaRef.current;

        if (!textarea) {
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = value.slice(start, end) || 'texto';

        const nextValue =
            value.slice(0, start) +
            prefix +
            selected +
            suffix +
            value.slice(end);

        onChange(nextValue);

        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + prefix.length,
                start + prefix.length + selected.length,
            );
        });
    };

    const applyBold = () => wrapSelection({ prefix: '**', suffix: '**' });
    const applyItalic = () => wrapSelection({ prefix: '*', suffix: '*' });
    const applyUnderline = () =>
        wrapSelection({ prefix: '<u>', suffix: '</u>' });

    return { textareaRef, applyBold, applyItalic, applyUnderline };
}
