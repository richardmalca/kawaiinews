<?php

namespace App\Support;

use App\Models\StorageSetting;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;

/**
 * Da acceso al disco remoto (Wasabi/S3) configurado desde el panel, como un
 * disco de Laravel con NOMBRE en vez de una instancia suelta creada con
 * Storage::build() — así en los tests se puede usar Storage::fake(NAME)
 * como con cualquier otro disco, sin pegarle a un bucket real.
 */
class RemoteStorage
{
    public const DISK_NAME = 'remote';

    public static function disk(?StorageSetting $settings = null): Filesystem
    {
        config(['filesystems.disks.'.self::DISK_NAME => ($settings ?? StorageSetting::current())->diskConfig()]);

        return Storage::disk(self::DISK_NAME);
    }
}
