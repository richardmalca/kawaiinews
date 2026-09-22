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

    // Las miniaturas de las cards del home/categorías se muestran a ~667px
    // de ancho como mucho (confirmado con Lighthouse) — 800 da margen para
    // pantallas de alta densidad (~1.2x) sin arrastrar el mismo peso que la
    // portada completa, que se usa en la página del artículo. Lighthouse
    // seguía marcando la variante de 900 como "más grande de lo necesario"
    // porque asume 1x; 800 la acerca más sin perder nitidez en retina.
    public const CARD_MAX_DIMENSION = 800;

    // 75 es lo que Google recomienda (Lighthouse/PageSpeed) como el mejor
    // punto entre peso y calidad visible para WebP.
    private const QUALITY = 75;

    /**
     * Devuelve el contenido en WebP, o null si no conviene optimizar (por
     * ejemplo un GIF, donde convertir a WebP estático le rompería la
     * animación) — quien llama debe guardar el original tal cual en ese
     * caso.
     */
    public function optimize(string $contents, string $mimeType): ?string
    {
        return $this->optimizeToWidth($contents, $mimeType, self::MAX_DIMENSION);
    }

    /**
     * Igual que optimize(), pero para la variante chica que se usa en
     * listados/cards en vez de la portada completa.
     */
    public function optimizeCard(string $contents, string $mimeType): ?string
    {
        return $this->optimizeToWidth($contents, $mimeType, self::CARD_MAX_DIMENSION);
    }

    private function optimizeToWidth(string $contents, string $mimeType, int $maxDimension): ?string
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

        $image = $this->resizeIfOversized($image, $maxDimension);

        ob_start();
        $success = imagewebp($image, null, self::QUALITY);
        $webp = ob_get_clean();

        return $success && $webp !== false ? $webp : null;
    }

    /**
     * @param  \GdImage  $image
     * @return \GdImage
     */
    private function resizeIfOversized($image, int $maxDimension)
    {
        $width = imagesx($image);
        $height = imagesy($image);

        if ($width <= $maxDimension && $height <= $maxDimension) {
            return $image;
        }

        $ratio = min($maxDimension / $width, $maxDimension / $height);
        $newWidth = max(1, (int) round($width * $ratio));
        $newHeight = max(1, (int) round($height * $ratio));

        $resized = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        $transparent = imagecolorallocatealpha($resized, 0, 0, 0, 127);
        imagefill($resized, 0, 0, $transparent);

        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        return $resized;
    }
}
