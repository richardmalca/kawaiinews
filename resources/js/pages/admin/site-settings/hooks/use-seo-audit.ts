import { useState } from 'react';
import { toast } from 'sonner';
import { seoAudit } from '@/routes/admin/site-settings';
import { fix as seoAuditFix } from '@/routes/admin/site-settings/seo-audit';

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

export type SeoFixSuggestion = {
    seo_title: string;
    description: string;
    keywords: string[];
};

function readCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

function postJson(url: string, body: unknown): Promise<Response> {
    return fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': readCsrfToken(),
        },
        body: JSON.stringify(body),
    });
}

export function useSeoAudit() {
    const [result, setResult] = useState<SeoAuditResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [fixing, setFixing] = useState(false);

    const runAudit = async () => {
        setLoading(true);

        const promise = postJson(seoAudit().url, {})
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

    // Le pasa a la IA lo que la auditoría ya encontró (no vuelve a pegarle
    // al sitio) para que redacte directamente un título, descripción y
    // palabras clave corregidos — el admin solo tiene que revisar y
    // guardar, en vez de escribirlos desde cero.
    const fixWithAi = async (
        onSuggestion: (suggestion: SeoFixSuggestion) => void,
    ) => {
        if (!result) {
            return;
        }

        setFixing(true);

        const promise = postJson(seoAuditFix().url, {
            tags: result.tags,
            checks: result.checks,
        })
            .then((response) => response.json())
            .then((data: SeoFixSuggestion & { error?: string }) => {
                if (data.error) {
                    throw new Error(data.error);
                }

                onSuggestion(data);
            })
            .finally(() => setFixing(false));

        toast.promise(promise, {
            loading: 'Generando título, descripción y palabras clave con IA...',
            success:
                'Listo — revisá los campos en "Identidad y SEO" antes de guardar',
            error: (error: Error) => error.message,
        });

        return promise;
    };

    return { result, loading, runAudit, fixing, fixWithAi };
}
