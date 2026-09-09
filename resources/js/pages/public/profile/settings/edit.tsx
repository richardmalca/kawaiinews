import { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import type { PublicCategorySummary } from '@/types';
import { AlertCircle, Check } from 'lucide-react';
import { useProfileSettingsForm } from '../hooks/use-profile-settings-form';
import { SettingsHeader } from '../components/settings-header';
import { SettingsBanner, SettingsAvatar } from '../components/settings-media';
import { SettingsFields, SettingsPrivacy } from '../components/settings-fields';
import { SettingsDangerZone } from '../components/settings-danger-zone';

interface ProfileSettingsEditProps {
    mustVerifyEmail: boolean;
    status?: string;
    categories?: Record<string, PublicCategorySummary>;
}

export default function ProfileSettingsEdit({
    categories,
}: ProfileSettingsEditProps) {
    const { auth } = usePage().props;
    const user = auth.user;

    const {
        form,
        bannerPreview,
        activeAvatar,
        fileError,
        avatarInputRef,
        bannerInputRef,
        handleAvatarChange,
        handleBannerChange,
        selectPresetBanner,
        setAvatarSource,
    } = useProfileSettingsForm({ user });

    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const {
        data: deleteData,
        setData: setDeleteData,
        delete: destroyAccount,
        processing: deleting,
        errors: deleteErrors,
    } = useForm({
        password: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/perfil/${user.username}/ajustes`);
    };

    const handleDeleteAccount = (e: React.FormEvent) => {
        e.preventDefault();
        destroyAccount(`/perfil/${user.username}/ajustes`);
    };

    return (
        <PublicLayout categories={categories}>
            <Head title="Ajustes de perfil y cuenta - KawaiiNews" />

            <div className="space-y-6">
                <SettingsHeader username={user.username} />

                {fileError && (
                    <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{fileError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-xs dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:shadow-none">
                        <SettingsBanner
                            bannerPreview={bannerPreview}
                            bannerInputRef={bannerInputRef}
                            onBannerChange={handleBannerChange}
                            onSelectPreset={selectPresetBanner}
                            error={form.errors.banner}
                        />

                        <div className="relative px-6 pb-6 sm:px-8 sm:pb-8">
                            <div className="-mt-12 sm:-mt-14 mb-6 flex flex-wrap items-end justify-between gap-4">
                                <SettingsAvatar
                                    user={user}
                                    activeAvatar={activeAvatar}
                                    avatarSource={form.data.avatar_source}
                                    avatarInputRef={avatarInputRef}
                                    onAvatarChange={handleAvatarChange}
                                    onSetAvatarSource={setAvatarSource}
                                    error={form.errors.custom_avatar}
                                />

                                <div className="flex items-center gap-2.5">
                                    <button
                                        type="submit"
                                        disabled={form.processing || Boolean(usernameError)}
                                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-500 dark:hover:bg-rose-600"
                                    >
                                        {form.recentlySuccessful ? (
                                            <>
                                                <Check className="h-4 w-4" />
                                                <span>Guardado</span>
                                            </>
                                        ) : (
                                            <span>{form.processing ? 'Guardando...' : 'Guardar cambios'}</span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <SettingsFields
                                name={form.data.name}
                                username={form.data.username}
                                email={user.email}
                                usernameError={usernameError}
                                errors={form.errors}
                                onNameChange={(val) => form.setData('name', val)}
                                onUsernameChange={(val) => form.setData('username', val)}
                                onUsernameErrorChange={setUsernameError}
                            />

                            <SettingsPrivacy
                                showShares={form.data.show_shares_on_profile}
                                onChange={(checked) => form.setData('show_shares_on_profile', checked)}
                            />
                        </div>
                    </div>
                </form>

                <SettingsDangerZone
                    deleteConfirm={deleteConfirm}
                    deleting={deleting}
                    passwordValue={deleteData.password}
                    passwordError={deleteErrors.password}
                    onToggleConfirm={setDeleteConfirm}
                    onPasswordChange={(val) => setDeleteData('password', val)}
                    onDeleteSubmit={handleDeleteAccount}
                />
            </div>
        </PublicLayout>
    );
}
