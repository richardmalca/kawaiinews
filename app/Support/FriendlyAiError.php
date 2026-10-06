<?php

namespace App\Support;

use Throwable;

class FriendlyAiError
{
    public static function forException(Throwable $exception): string
    {
        $message = $exception->getMessage();

        if (str_contains($message, 'rejected by the safety system')) {
            return 'OpenAI rechazó generar esta imagen por su filtro de seguridad de contenido (puede pasar con ciertos nombres o descripciones, sin previo aviso). Intenta de nuevo (a veces con el mismo texto funciona en el segundo intento) o ajusta el resumen/contenido de la noticia y vuelve a intentar.';
        }

        return $message;
    }
}
