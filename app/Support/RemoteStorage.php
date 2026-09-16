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

        // El manager de discos de Laravel cachea la instancia ya armada
        // con el nombre "remote" durante toda la vida del proceso PHP. En
        // un request normal no se nota (cada visita es un proceso
        // nuevo), pero el worker de la cola es un proceso de larga
        // duración: sin este olvido, seguiría usando para siempre las
        // credenciales que estaban activas la primera vez que se resolvió
        // este disco, ignorando cualquier cambio posterior en
        // Configuración > Almacenamiento. En los tests se salta este
        // paso para no pisar el disco falso que arma Storage::fake().
        if (! app()->runningUnitTests()) {
            Storage::forgetDisk(self::DISK_NAME);
        }

        return Storage::disk(self::DISK_NAME);
    }
}
