export interface UsernameValidationResult {
    isValid: boolean;
    error: string | null;
}

export function sanitizeUsernameInput(raw: string): string {
    return raw
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 25);
}

export function validateUsername(value: string): UsernameValidationResult {
    if (!value) {
        return {
            isValid: false,
            error: 'Debes ingresar un nombre de usuario.',
        };
    }

    if (/\s/.test(value)) {
        return {
            isValid: false,
            error: 'No se permiten espacios. Usa guion bajo (_).',
        };
    }

    if (/[A-Z]/.test(value)) {
        return {
            isValid: false,
            error: 'Solo se permiten letras en minúscula.',
        };
    }

    if (/[^a-z0-9_]/.test(value)) {
        return {
            isValid: false,
            error: 'Sin caracteres especiales. Solo letras, números y guion bajo (_).',
        };
    }

    if (value.length < 3) {
        return {
            isValid: false,
            error: 'Debe tener al menos 3 caracteres.',
        };
    }

    if (value.length > 25) {
        return {
            isValid: false,
            error: 'No debe exceder los 25 caracteres.',
        };
    }

    const reserved = ['mi-cuenta', 'admin', 'ajustes', 'settings', 'api', 'perfil'];
    if (reserved.includes(value)) {
        return {
            isValid: false,
            error: 'Este nombre de usuario está reservado por el sistema.',
        };
    }

    return {
        isValid: true,
        error: null,
    };
}

export const OPEN_CHOOSE_USERNAME_EVENT = 'kawaii:open-choose-username';

export function openChooseUsernameModal(): void {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(OPEN_CHOOSE_USERNAME_EVENT));
    }
}
