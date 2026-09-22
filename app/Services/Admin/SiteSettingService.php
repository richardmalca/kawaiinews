<?php

namespace App\Services\Admin;

use App\Models\SiteSetting;
use App\Models\StorageSetting;
use App\Support\RemoteStorage;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Maneja los uploads de configuración del sitio (logo, favicon, imagen
 * OpenGraph por defecto) y genera automáticamente los tamaños de favicon
 * que necesita cada plataforma, usando GD (viene con PHP, no agrega una
 * dependencia nueva) — el admin solo sube una imagen cuadrada grande.
 */
class SiteSettingService
{
    /**
     * Mismo criterio que MediaLibraryService::mediaDisk(): Wasabi/R2 si
     * está configurado y activado para medios en Configuración de
     * almacenamiento, el disco local ("public") si no — así el logo y los
     * favicons no se quedan siempre en el servidor mientras el resto de
     * los medios (imágenes/audio de artículos) sí va al almacenamiento
     * externo.
     */
    private function disk(): Filesystem
    {
        $storageSettings = StorageSetting::current();

        if ($storageSettings->active_for_media && $storageSettings->isConfigured()) {
            return RemoteStorage::disk($storageSettings);
        }

        return Storage::disk('public');
    }

    /**
     * @param  array{name: string, description: ?string, keywords: array<int, string>, theme_color: ?string, twitter_handle: ?string}  $data
     */
    public function update(SiteSetting $settings, array $data): SiteSetting
    {
        $settings->update($data);

        return $settings;
    }

    public function updateLogo(SiteSetting $settings, UploadedFile $file): SiteSetting
    {
        $this->deleteIfExists($settings->logo_path);

        $source = $this->loadImage($file);
        $width = imagesx($source);
        $height = imagesy($source);
        $maxDimension = 180;

        if ($width > $maxDimension || $height > $maxDimension) {
            $ratio = min($maxDimension / $width, $maxDimension / $height);
            $targetWidth = (int) round($width * $ratio);
            $targetHeight = (int) round($height * $ratio);
        } else {
            $targetWidth = $width;
            $targetHeight = $height;
        }

        $path = 'site/logo-'.$file->hashName().'.webp';
        $path = $this->resizeAndStore($source, 0, 0, $width, $height, $targetWidth, $targetHeight, $path);
        imagedestroy($source);

        $settings->update(['logo_path' => $path]);

        return $settings;
    }

    public function removeLogo(SiteSetting $settings): SiteSetting
    {
        $this->deleteIfExists($settings->logo_path);
        $settings->update(['logo_path' => null]);

        return $settings;
    }

    /**
     * Genera, a partir de una sola imagen subida, todos los tamaños de
     * favicon que hacen falta: 32x32 (pestaña del navegador), 192x192 y
     * 512x512 (ícono de Android/PWA, este último para el splash screen y
     * el ícono de "agregar a pantalla de inicio") y 180x180
     * (apple-touch-icon, iOS). Recorta al centro en cuadrado si la imagen
     * no es cuadrada, así no queda deformado.
     */
    public function updateFavicon(SiteSetting $settings, UploadedFile $file): SiteSetting
    {
        $this->deleteIfExists($settings->favicon_path);
        $this->deleteIfExists($settings->favicon_192_path);
        $this->deleteIfExists($settings->favicon_512_path);
        $this->deleteIfExists($settings->apple_touch_icon_path);

        $source = $this->loadImage($file);

        $paths = [
            'favicon_path' => $this->resizeSquareAndStore($source, 32, 'site/favicon-32.png'),
            'favicon_192_path' => $this->resizeSquareAndStore($source, 192, 'site/favicon-192.png'),
            'favicon_512_path' => $this->resizeSquareAndStore($source, 512, 'site/favicon-512.png'),
            'apple_touch_icon_path' => $this->resizeSquareAndStore($source, 180, 'site/apple-touch-icon.png'),
        ];

        imagedestroy($source);

        $settings->update($paths);

        return $settings;
    }

    /**
     * La imagen OG se recorta/escala a 1200x630 (el tamaño que recomiendan
     * Facebook/Twitter) para que se vea bien al compartir un link del
     * sitio, sin depender de que el admin suba justo esa proporción.
     */
    public function updateOgImage(SiteSetting $settings, UploadedFile $file): SiteSetting
    {
        $this->deleteIfExists($settings->og_image_path);

        $source = $this->loadImage($file);
        $path = $this->resizeCoverAndStore($source, 1200, 630, 'site/og-image.png');
        imagedestroy($source);

        $settings->update(['og_image_path' => $path]);

        return $settings;
    }

    /**
     * @return \GdImage
     */
    private function loadImage(UploadedFile $file)
    {
        $image = @imagecreatefromstring($file->get());

        if (! $image) {
            throw new RuntimeException('No se pudo procesar la imagen. Probá con un PNG o JPG.');
        }

        return $image;
    }

    private function resizeSquareAndStore($source, int $size, string $path): string
    {
        $width = imagesx($source);
        $height = imagesy($source);
        $cropSize = min($width, $height);
        $srcX = (int) (($width - $cropSize) / 2);
        $srcY = (int) (($height - $cropSize) / 2);

        return $this->resizeAndStore($source, $srcX, $srcY, $cropSize, $cropSize, $size, $size, $path);
    }

    private function resizeCoverAndStore($source, int $targetWidth, int $targetHeight, string $path): string
    {
        $width = imagesx($source);
        $height = imagesy($source);
        $targetRatio = $targetWidth / $targetHeight;
        $sourceRatio = $width / $height;

        if ($sourceRatio > $targetRatio) {
            $cropHeight = $height;
            $cropWidth = (int) ($height * $targetRatio);
        } else {
            $cropWidth = $width;
            $cropHeight = (int) ($width / $targetRatio);
        }

        $srcX = (int) (($width - $cropWidth) / 2);
        $srcY = (int) (($height - $cropHeight) / 2);

        return $this->resizeAndStore($source, $srcX, $srcY, $cropWidth, $cropHeight, $targetWidth, $targetHeight, $path);
    }

    private function resizeAndStore($source, int $srcX, int $srcY, int $srcWidth, int $srcHeight, int $dstWidth, int $dstHeight, string $path): string
    {
        $canvas = imagecreatetruecolor($dstWidth, $dstHeight);
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
        imagefill($canvas, 0, 0, $transparent);

        imagecopyresampled($canvas, $source, 0, 0, $srcX, $srcY, $dstWidth, $dstHeight, $srcWidth, $srcHeight);

        ob_start();
        if (str_ends_with(strtolower($path), '.webp') && function_exists('imagewebp')) {
            imagewebp($canvas, null, 85);
        } else {
            imagepng($canvas);
        }
        $contents = ob_get_clean();
        imagedestroy($canvas);

        $this->disk()->put($path, $contents);

        return $path;
    }

    /**
     * Borra un archivo viejo sin asumir en qué disco vive: puede haberse
     * subido cuando el almacenamiento externo estaba desactivado (local) y
     * borrarse después de activarlo (o al revés) — se prueba en el disco
     * que esté activo ahora y, si no está ahí, en el local, para no dejar
     * basura huérfana en ningún lado.
     */
    private function deleteIfExists(?string $path): void
    {
        if (! $path) {
            return;
        }

        $activeDisk = $this->disk();

        if ($activeDisk->exists($path)) {
            $activeDisk->delete($path);

            return;
        }

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
