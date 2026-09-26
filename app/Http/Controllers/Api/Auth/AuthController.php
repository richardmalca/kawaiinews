<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Admin\ImageOptimizerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function __construct(
        private readonly ImageOptimizerService $imageOptimizerService,
    ) {}

    /**
     * Shape mínimo y estable que espera el frontend Next.js (SafeUser),
     * en vez de devolver el modelo Eloquent completo tal cual.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json($this->presentUser($request->user()));
    }

    /**
     * Revoca únicamente el token de Sanctum usado en esta request (el del
     * frontend Next.js) — no toca la sesión web de Inertia, son dos cosas
     * separadas para el mismo usuario.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada.']);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => [
                'sometimes',
                'nullable',
                'string',
                'min:3',
                'max:25',
                'regex:/^[a-zA-Z0-9_]+$/',
                Rule::notIn(['mi-cuenta', 'admin', 'ajustes', 'settings', 'api', 'perfil']),
                Rule::unique('users')->ignore($user->id),
            ],
            'show_shares_on_profile' => ['sometimes', 'boolean'],
            'notify_article_comments' => ['sometimes', 'boolean'],
            'notify_comment_replies' => ['sometimes', 'boolean'],
            'notify_comment_likes' => ['sometimes', 'boolean'],
            'notify_article_reactions' => ['sometimes', 'boolean'],
            'notify_followers' => ['sometimes', 'boolean'],
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Perfil actualizado con éxito.',
            'user' => $this->presentUser($user),
        ]);
    }

    /**
     * Sube (o reemplaza) la foto de perfil. Además de validar que sea
     * realmente una imagen rasterizada (nunca SVG — ese es el vector
     * clásico de XSS en uploads, un SVG puede traer <script> adentro), la
     * re-codifica con GD: decodifica los píxeles reales y genera un WebP
     * desde cero. Eso destruye cualquier payload escondido en metadata/EXIF
     * o un archivo "polyglot" (válido como imagen Y como otra cosa a la
     * vez) — la validación de MIME/extensión sola no alcanza para eso.
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,webp,gif', 'max:2048'],
        ]);

        $user = $request->user();
        $file = $request->file('avatar');
        $contents = $file->get();

        // GIF se guarda tal cual (re-codificar le rompería la animación,
        // ver ImageOptimizerService) — igual sigue siendo un formato
        // rasterizado sin capacidad de ejecutar script, así que no pierde
        // la protección real que importa acá.
        $optimized = $this->imageOptimizerService->optimizeCard($contents, $file->getMimeType());
        $extension = $optimized ? 'webp' : $file->extension();
        $path = 'avatars/'.Str::random(40).'.'.$extension;

        Storage::disk('public')->put($path, $optimized ?? $contents);

        if ($user->custom_avatar && str_starts_with($user->custom_avatar, '/storage/')) {
            $oldPath = str_replace('/storage/', '', $user->custom_avatar);
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        $user->update([
            'custom_avatar' => '/storage/'.$path,
            'avatar_source' => 'custom',
        ]);

        return response()->json([
            'message' => 'Foto de perfil actualizada.',
            'user' => $this->presentUser($user->fresh()),
        ]);
    }

    /**
     * Igual que updateAvatar() pero para el banner del perfil — mismo
     * criterio de seguridad (re-codificar con GD), sin GIF acá (el banner
     * nunca necesitó animación y así se mantiene el código más simple).
     */
    public function updateBanner(Request $request): JsonResponse
    {
        $request->validate([
            'banner' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:4096'],
        ]);

        $user = $request->user();
        $file = $request->file('banner');
        $contents = $file->get();

        $optimized = $this->imageOptimizerService->optimize($contents, $file->getMimeType());
        $extension = $optimized ? 'webp' : $file->extension();
        $path = 'banners/'.Str::random(40).'.'.$extension;

        Storage::disk('public')->put($path, $optimized ?? $contents);

        if ($user->banner && str_starts_with($user->banner, '/storage/')) {
            $oldPath = str_replace('/storage/', '', $user->banner);
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        $user->update(['banner' => '/storage/'.$path]);

        return response()->json([
            'message' => 'Portada de perfil actualizada.',
            'user' => $this->presentUser($user->fresh()),
        ]);
    }

    public function deleteAccount(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->authoredArticles()->update([
            'status' => 'draft',
        ]);

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Cuenta eliminada correctamente.']);
    }

    /**
     * Shape mínimo y estable que espera el frontend Next.js (SafeUser), en
     * vez de devolver el modelo Eloquent completo tal cual.
     *
     * @return array<string, mixed>
     */
    private function presentUser(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'username' => $user->username,
            'avatar' => $user->active_avatar_url,
            'banner' => $user->active_banner_url,
            'show_shares_on_profile' => (bool) $user->show_shares_on_profile,
            'notify_article_comments' => (bool) $user->notify_article_comments,
            'notify_comment_replies' => (bool) $user->notify_comment_replies,
            'notify_comment_likes' => (bool) $user->notify_comment_likes,
            'notify_article_reactions' => (bool) $user->notify_article_reactions,
            'notify_followers' => (bool) $user->notify_followers,
            'is_author' => $user->hasRole(['superadmin', 'editor']),
            'role' => $user->hasAnyRole(['superadmin', 'admin']) ? 'admin'
                : ($user->hasRole('editor') ? 'editor' : 'user'),
            'roles' => $user->roles->pluck('name')->all(),
        ];
    }
}
