import { AlertCircle, CheckCircle2, Chrome, Lock } from 'lucide-react';
import { sanitizeUsernameInput, validateUsername } from '@/lib/username-rules';

interface SettingsFieldsProps {
    name: string;
    username: string;
    email: string;
    usernameError: string | null;
    errors: {
        name?: string;
        username?: string;
    };
    onNameChange: (val: string) => void;
    onUsernameChange: (val: string) => void;
    onUsernameErrorChange: (error: string | null) => void;
}

export function SettingsFields({
    name,
    username,
    email,
    usernameError,
    errors,
    onNameChange,
    onUsernameChange,
    onUsernameErrorChange,
}: SettingsFieldsProps) {
    const handleUsernameInput = (val: string) => {
        const cleaned = sanitizeUsernameInput(val);
        onUsernameChange(cleaned);
        const validation = validateUsername(cleaned);
        onUsernameErrorChange(validation.error);
    };

    return (
        <div className="grid grid-cols-1 gap-6 border-t border-neutral-100 pt-6 sm:grid-cols-2 lg:grid-cols-3 dark:border-neutral-800">
            <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Nombre para mostrar
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs text-neutral-900 transition-colors focus:border-rose-500 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:focus:border-rose-400"
                    required
                />
                {errors.name && (
                    <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.name}</p>
                )}
            </div>

            <div>
                <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Nombre de usuario (@usuario)
                    </label>
                    <span className="font-mono text-[11px] text-neutral-400">
                        {username.length}/25
                    </span>
                </div>
                <div className="relative">
                    <span className="pointer-events-none absolute top-2.5 left-3.5 text-xs font-semibold text-neutral-400">
                        @
                    </span>
                    <input
                        type="text"
                        value={username}
                        maxLength={25}
                        onChange={(e) => handleUsernameInput(e.target.value)}
                        className={`w-full rounded-xl border bg-neutral-50/50 pr-9 pl-8 py-2.5 font-mono text-xs text-neutral-900 transition-colors focus:bg-white focus:outline-none dark:bg-neutral-900 dark:text-white ${
                            usernameError || errors.username
                                ? 'border-rose-500 focus:border-rose-500 dark:border-rose-400'
                                : 'border-neutral-200 focus:border-rose-500 dark:border-neutral-800'
                        }`}
                        required
                    />
                    <div className="pointer-events-none absolute top-2.5 right-3">
                        {usernameError || errors.username ? (
                            <AlertCircle className="h-4 w-4 text-rose-500" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                    </div>
                </div>
                {usernameError || errors.username ? (
                    <p className="mt-1 text-[11px] font-medium text-rose-500">
                        {usernameError || errors.username}
                    </p>
                ) : (
                    <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                        Letras, números y guion bajo (_).
                    </p>
                )}
            </div>

            <div>
                <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Correo electrónico
                    </label>
                    <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400">
                        <Chrome className="h-2.5 w-2.5 text-rose-500" />
                        Google
                    </span>
                </div>
                <div className="relative">
                    <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-100/80 pr-8 pl-3.5 py-2.5 text-xs text-neutral-500 select-none dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400"
                    />
                    <Lock className="pointer-events-none absolute top-3 right-3 h-3.5 w-3.5 text-neutral-400" />
                </div>
                <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                    Vinculado a Google OAuth (no editable).
                </p>
            </div>
        </div>
    );
}

interface SettingsPrivacyProps {
    showShares: boolean;
    onChange: (checked: boolean) => void;
}

export function SettingsPrivacy({ showShares, onChange }: SettingsPrivacyProps) {
    return (
        <div className="mt-6 border-t border-neutral-100 pt-6 dark:border-neutral-800">
            <div className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800/80 dark:bg-neutral-800/40">
                <input
                    id="show_shares"
                    type="checkbox"
                    checked={showShares}
                    onChange={(e) => onChange(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-rose-600 focus:ring-rose-500 dark:border-neutral-700 dark:bg-neutral-800"
                />
                <label htmlFor="show_shares" className="cursor-pointer text-xs">
                    <span className="font-semibold text-neutral-900 dark:text-white">
                        Mostrar noticias que compartí en mi perfil público
                    </span>
                    <p className="text-neutral-500 dark:text-neutral-400">
                        Si lo activas, los visitantes de tu perfil podrán ver los artículos que compartiste en la comunidad.
                    </p>
                </label>
            </div>
        </div>
    );
}
