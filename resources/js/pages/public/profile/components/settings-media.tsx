import type { RefObject } from 'react';
import { useState } from 'react';
import { Camera, Chrome, Sparkles, Upload } from 'lucide-react';
import type { User } from '@/types';
import { AnimeBannerModal } from './anime-banner-modal';

interface SettingsBannerProps {
    bannerPreview: string | null;
    bannerInputRef: RefObject<HTMLInputElement | null>;
    onBannerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectPreset: (url: string) => void;
    error?: string;
}

export function SettingsBanner({
    bannerPreview,
    bannerInputRef,
    onBannerChange,
    onSelectPreset,
    error,
}: SettingsBannerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div>
            <div className="relative h-44 w-full overflow-hidden bg-neutral-900 sm:h-56 md:h-64">
                {bannerPreview ? (
                    <img
                        src={bannerPreview}
                        alt="Portada del perfil"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2 sm:top-5 sm:right-5">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/20 bg-black/60 px-3.5 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/80 active:scale-95"
                    >
                        <Sparkles className="h-3.5 w-3.5 text-rose-400" />
                        <span>Elegir fondo</span>
                    </button>

                    <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={onBannerChange}
                    />
                    <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/20 bg-black/60 px-3.5 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/80 active:scale-95"
                    >
                        <Camera className="h-3.5 w-3.5 text-neutral-300" />
                        <span>Subir propia</span>
                    </button>
                </div>

                <div className="absolute top-4 left-4 rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md">
                    1200 × 400 px
                </div>
            </div>

            <AnimeBannerModal
                open={isModalOpen}
                currentBannerUrl={bannerPreview}
                onOpenChange={setIsModalOpen}
                onSelectBanner={onSelectPreset}
            />

            {error && <p className="mt-1.5 px-6 text-xs font-medium text-rose-500">{error}</p>}
        </div>
    );
}

interface SettingsAvatarProps {
    user: User;
    activeAvatar: string | null | undefined;
    avatarSource: 'google' | 'custom';
    avatarInputRef: RefObject<HTMLInputElement | null>;
    onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSetAvatarSource: (source: 'google' | 'custom') => void;
    error?: string;
}

export function SettingsAvatar({
    user,
    activeAvatar,
    avatarSource,
    avatarInputRef,
    onAvatarChange,
    onSetAvatarSource,
    error,
}: SettingsAvatarProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            <div className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-rose-500/10 text-3xl font-black text-rose-600 shadow-md sm:h-28 sm:w-28 dark:border-neutral-900 dark:bg-rose-500/20 dark:text-rose-400">
                {activeAvatar ? (
                    <img
                        src={activeAvatar}
                        alt={user.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    user.name.charAt(0).toUpperCase()
                )}

                <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    title="Subir foto personalizada"
                    className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                    <Camera className="h-5 w-5" />
                </button>
            </div>

            <div className="space-y-2 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                    {user.avatar && (
                        <button
                            type="button"
                            onClick={() => onSetAvatarSource('google')}
                            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                avatarSource === 'google'
                                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-400'
                                    : 'border-neutral-200 bg-neutral-100/80 text-neutral-700 hover:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                            }`}
                        >
                            <Chrome className="h-3.5 w-3.5 text-rose-500" />
                            <span>Foto de Google</span>
                        </button>
                    )}

                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={onAvatarChange}
                    />
                    <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-100/80 px-3 py-1.5 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                    >
                        <Upload className="h-3.5 w-3.5 text-rose-500" />
                        <span>Subir personalizada</span>
                    </button>
                </div>

                <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                    {avatarSource === 'google'
                        ? 'Foto importada de tu cuenta de Google.'
                        : 'Foto personalizada cargada.'}
                </p>
                {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}
            </div>
        </div>
    );
}
