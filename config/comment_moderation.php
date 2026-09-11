<?php

return [
    /**
     * Si el comentario contiene alguna de estas palabras/frases (sin
     * distinguir mayúsculas ni acentos), queda en `pending` en vez de
     * publicarse directo. Lista corta a propósito: mejor pocos falsos
     * positivos que bloquear comentarios normales de fans discutiendo.
     */
    'banned_words' => [
        // Insultos comunes en español.
        'boludo de mierda',
        'hijo de puta',
        'pelotudo',
        'concha de tu madre',
        // Spam típico.
        'gana dinero',
        'gane dinero',
        'trabaja desde casa',
        'haz clic aqui',
        'click aqui',
        'compra seguidores',
        'oferta limitada',
    ],

    /**
     * 2 o más URLs en el mismo comentario (o 1 sola, a un dominio que no
     * sea el propio sitio) es la señal de spam más común de bots.
     */
    'max_links' => 1,

    /**
     * Mismo usuario posteando texto igual o muy parecido más de esta
     * cantidad de veces en la última hora -> pending. Esto es un filtro
     * de contenido repetido, no de frecuencia (para eso ya existe el
     * throttle:20,1 en la ruta).
     */
    'max_repeated_comments_per_hour' => 3,
];
