import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Sube una sola imagen (logo, favicon o imagen OG) a la ruta indicada. Se
 * usa router.post con FormData porque los otros tres campos del sitio se
 * guardan aparte (texto plano vía PUT) — subir la imagen en su propia
 * request evita mezclar archivos con el resto del formulario.
 */
export function useSiteImageUpload(url: string, fieldName: string, loadingLabel: string, successLabel: string) {
    const [processing, setProcessing] = useState(false);

    const upload = (file: File) => {
        setProcessing(true);

        const formData = new FormData();
        formData.append(fieldName, file);

        const promise = new Promise<void>((resolve, reject) => {
            router.post(url, formData, {
                preserveScroll: true,
                onSuccess: () => resolve(),
                onError: () => reject(),
                onFinish: () => setProcessing(false),
            });
        });

        toast.promise(promise, {
            loading: loadingLabel,
            success: successLabel,
            error: 'No se pudo procesar la imagen. Probá con un PNG o JPG.',
        });
    };

    return { upload, processing };
}
