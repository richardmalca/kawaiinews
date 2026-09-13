<?php

use App\Models\NewsArticle;
use App\Models\User;

test('many comments from different users but the same ip get rate limited', function () {
    $article = NewsArticle::factory()->published()->create();

    // El throttle normal (20/min) es por usuario logueado — con una cuenta
    // distinta en cada request, ese límite nunca se activa. El límite por
    // IP (30/min) sí, porque el test client siempre pega desde la misma IP.
    for ($i = 1; $i <= 30; $i++) {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson(route('public.comments.store', $article->slug), ['body' => "Comentario número {$i}"])
            ->assertCreated();
    }

    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson(route('public.comments.store', $article->slug), ['body' => 'Uno de más'])
        ->assertStatus(429);
});
