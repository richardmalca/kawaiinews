<?php

namespace App\Services\Admin;

/**
 * Redimensiona (si hace falta) y convierte a WebP las imágenes que se suben
 * o se generan con IA, para no ocupar espacio de más sin perder calidad
 * visible — usa GD, que ya viene con PHP, sin agregar dependencias nuevas.
 */
class ImageOptimizerService
{
    // Ningún uso en el sitio (portada, OG, banners) necesita más que esto;
    // bajarlo evita subir fotos de 4000px+ tal cual las entrega una cámara
    // o un modelo de IA.
    private const MAX_DIMENSION = 1920;

    // 82 es el punto donde WebP deja de perder calidad visible pero ya
    // pesa bastante menos que un JPEG/PNG sin comprimir.
    private const QUALITY = 82;

    /**
     * Devuelve el contenido en WebP, o null si no conviene optimizar (por
     * ejemplo un GIF, donde convertir a WebP estático le rompería la
     * animación) — quien llama debe guardar el original tal cual en ese
     * caso.
     */
    public function optimize(string $contents, string $mimeType): ?string
    {
        if ($mimeType === 'image/gif' || ! function_exists('imagewebp')) {
            return null;
        }

        $image = @imagecreatefromstring($contents);

        if (! $image) {
            return null;
        }

        imagepalettetotruecolor($image);
        imagealphablending($image, true);
        imagesavealpha($image, true);

        $image = $this->resizeIfOversized($image);

        ob_start();
        $success = imagewebp($image, null, self::QUALITY);
        $webp = ob_get_clean();
        imagedestroy($image);

        return $success && $webp !== false ? $webp : null;
    }

    /**
     * @param  \GdImage  $image
     * @return \GdImage
     */
    private function resizeIfOversized($image)
    {
        $width = imagesx($image);
        $height = imagesy($image);

        if ($width <= self::MAX_DIMENSION && $height <= self::MAX_DIMENSION) {
            return $image;
        }

        $ratio = min(self::MAX_DIMENSION / $width, self::MAX_DIMENSION / $height);
        $newWidth = max(1, (int) round($width * $ratio));
        $newHeight = max(1, (int) round($height * $ratio));

        $resized = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        $transparent = imagecolorallocatealpha($resized, 0, 0, 0, 127);
        imagefill($resized, 0, 0, $transparent);

        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagedestroy($image);

        return $resized;
    }
}
