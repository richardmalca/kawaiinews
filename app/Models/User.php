<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Overtrue\LaravelFavorite\Traits\Favoriter;
use Overtrue\LaravelFollow\Traits\Followable;
use Overtrue\LaravelFollow\Traits\Follower;
use Overtrue\LaravelLike\Traits\Liker;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string|null $username
 * @property bool $show_shares_on_profile
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'username', 'email', 'password', 'google_id', 'show_shares_on_profile', 'avatar', 'custom_avatar', 'banner', 'avatar_source'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    use Favoriter, Followable, Follower, HasFactory, HasRoles, Liker, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'show_shares_on_profile' => 'boolean',
        ];
    }

    public function getActiveAvatarUrlAttribute(): ?string
    {
        if ($this->avatar_source === 'custom' && $this->custom_avatar) {
            return $this->custom_avatar;
        }

        return $this->avatar ?: $this->custom_avatar;
    }

    /**
     * Noticias redactadas por este usuario (solo tiene sentido para
     * superadmin/editor, los únicos roles que pueden generar/editar
     * artículos en KawaiiNews).
     */
    public function authoredArticles(): HasMany
    {
        return $this->hasMany(NewsArticle::class, 'author_id');
    }

    /**
     * Noticias que este usuario compartió (registro/contador, no un
     * "repost"). Solo se muestran en su perfil público si él lo habilitó
     * vía `show_shares_on_profile`.
     */
    public function shares(): HasMany
    {
        return $this->hasMany(Share::class);
    }

    /**
     * Comentarios realizados por este usuario.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Categorías seguidas por el usuario.
     */
    public function followedCategories(): BelongsToMany
    {
        return $this->belongsToMany(
            related: User::class,
            table: 'category_user',
            foreignPivotKey: 'user_id',
            relatedPivotKey: 'id',
        )->withTimestamps();
    }

    public function isFollowingCategory(string $category): bool
    {
        return DB::table('category_user')
            ->where('user_id', $this->id)
            ->where('category', $category)
            ->exists();
    }

    public function toggleFollowCategory(string $category): bool
    {
        $existing = DB::table('category_user')
            ->where('user_id', $this->id)
            ->where('category', $category);

        if ($existing->exists()) {
            $existing->delete();

            return false;
        }

        DB::table('category_user')->insert([
            'user_id' => $this->id,
            'category' => $category,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return true;
    }

    public function publishedArticlesCount(): int
    {
        return $this->authoredArticles()->where('status', 'published')->count();
    }
}
