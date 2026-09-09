import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import type { PublicCategorySummary, PublicUserProfile } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { useProfileFollow } from './hooks/use-profile-follow';
import { ProfileHeader } from './components/profile-header';
import { ProfileSharedArticles } from './components/profile-shared-articles';

interface ProfileShowProps {
    profile: PublicUserProfile;
    categories?: Record<string, PublicCategorySummary>;
}

export default function ProfileShow({ profile, categories }: ProfileShowProps) {
    const { isFollowing, followersCount, isSubmitting, toggleFollow } = useProfileFollow({ profile });

    return (
        <PublicLayout categories={categories}>
            <Head title={`@${profile.username} - KawaiiNews`} />

            <div className="mb-6 flex items-center justify-between">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Volver a la portada</span>
                </Link>
            </div>

            <ProfileHeader
                profile={profile}
                followersCount={followersCount}
                isFollowing={isFollowing}
                isSubmitting={isSubmitting}
                onToggleFollow={toggleFollow}
            />

            {profile.shares_visible && (
                <ProfileSharedArticles shares={profile.shares} />
            )}
        </PublicLayout>
    );
}
