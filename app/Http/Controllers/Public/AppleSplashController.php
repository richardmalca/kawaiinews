<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Models\StorageSetting;
use App\Support\RemoteStorage;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class AppleSplashController extends Controller
{
    public function __invoke(Request $request, int $width, int $height): Response
    {
        $width = max(320, min(3000, $width));
        $height = max(320, min(3000, $height));
        $theme = $request->query('theme') === 'dark' ? 'dark' : 'light';

        $settings = SiteSetting::current();
        $logoPath = $settings->logo_path ?? $settings->apple_touch_icon_path ?? $settings->favicon_512_path;

        $cacheKey = "apple_splash_{$width}_{$height}_{$theme}_".md5((string) $logoPath);

        $imageData = Cache::remember($cacheKey, 86400 * 7, function () use ($width, $height, $theme, $settings) {
            return $this->generateSplash($width, $height, $theme, $settings);
        });

        return response($imageData, 200, [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'public, max-age=604800, immutable',
        ]);
    }

    private function generateSplash(int $width, int $height, string $theme, SiteSetting $settings): string
    {
        $canvas = imagecreatetruecolor($width, $height);

        if ($theme === 'dark') {
            $bgColor = imagecolorallocate($canvas, 9, 9, 11);
        } else {
            $bgColor = imagecolorallocate($canvas, 255, 255, 255);
        }

        imagefill($canvas, 0, 0, $bgColor);

        $logoBinary = $this->getLogoBinary($settings);

        if ($logoBinary) {
            $logo = @imagecreatefromstring($logoBinary);

            if ($logo) {
                imagealphablending($canvas, true);
                imagesavealpha($canvas, true);

                $logoW = imagesx($logo);
                $logoH = imagesy($logo);

                $targetSize = (int) round(min($width, $height) * 0.28);
                $targetSize = max(96, min(320, $targetSize));

                $ratio = min($targetSize / $logoW, $targetSize / $logoH);
                $dstW = (int) round($logoW * $ratio);
                $dstH = (int) round($logoH * $ratio);

                $dstX = (int) round(($width - $dstW) / 2);
                $dstY = (int) round(($height - $dstH) / 2);

                imagecopyresampled($canvas, $logo, $dstX, $dstY, 0, 0, $dstW, $dstH, $logoW, $logoH);
                imagedestroy($logo);
            }
        }

        ob_start();
        imagepng($canvas, null, 6);
        $result = (string) ob_get_clean();
        imagedestroy($canvas);

        return $result;
    }

    private function getLogoBinary(SiteSetting $settings): ?string
    {
        $possiblePaths = array_filter([
            $settings->logo_path,
            $settings->apple_touch_icon_path,
            $settings->favicon_512_path,
        ]);

        $storageSettings = StorageSetting::current();
        $remoteDisk = ($storageSettings->active_for_media && $storageSettings->isConfigured())
            ? RemoteStorage::disk($storageSettings)
            : null;

        foreach ($possiblePaths as $path) {
            if ($remoteDisk && $remoteDisk->exists($path)) {
                return $remoteDisk->get($path);
            }

            if (Storage::disk('public')->exists($path)) {
                return Storage::disk('public')->get($path);
            }
        }

        $fallback = public_path('apple-touch-icon.png');
        if (file_exists($fallback)) {
            return (string) file_get_contents($fallback);
        }

        return null;
    }
}
