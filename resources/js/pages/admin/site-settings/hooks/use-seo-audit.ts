import { useState } from 'react';
import { toast } from 'sonner';
import { seoAudit } from '@/routes/admin/site-settings';

type SeoCheck = {
    key: string;
    label: string;
    status: 'ok' | 'warn' | 'fail';
    detail: string;
};

type SeoAuditResult = {
    tags: Record<string, string | number | null>;
    checks: SeoCheck[];
    ai_review: string | null;
    error: string | null;
};

function readCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

export function useSeoAudit() {
    const [result, setResult] = useState<SeoAuditResult | null>(null);
    const [loading, setLoading] = useState(false);

    const runAudit = async () => {
        setLoading(true);

        const promise = fetch(seoAudit().url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': readCsrfToken(),
            },
        })
            .then((response) => response.json())
            .then((data: SeoAuditResult) => {
                if (data.error) {
                    throw new Error(data.error);
                }

                setResult(data);
            })
            .finally(() => setLoading(false));

        toast.promise(promise, {
            loading: 'Analizando el sitio...',
            success: 'Análisis listo',
            error: (error: Error) => error.message,
        });

        return promise;
    };

    return { result, loading, runAudit };
}
