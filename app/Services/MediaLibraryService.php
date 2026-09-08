<?php

namespace App\Services;

use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaLibraryService
{
    public function list()
    {
        return Media::orderByDesc('id')->get();
    }

    public function storeUpload(UploadedFile $file): Media
    {
        $path = $file->store('media', 'public');

        return Media::create([
            'url' => Storage::disk('public')->url($path),
            'original_name' => $file->getClientOriginalName(),
            'source' => 'upload',
        ]);
    }

    public function storeFromUrl(string $url): Media
    {
        return Media::create([
            'url' => $url,
            'original_name' => Str::afterLast(parse_url($url, PHP_URL_PATH) ?? '', '/') ?: null,
            'source' => 'url',
        ]);
    }

    public function delete(Media $media): void
    {
        if ($media->source === 'upload') {
            $path = Str::after($media->url, Storage::disk('public')->url(''));
            Storage::disk('public')->delete($path);
        }

        $media->delete();
    }
}
