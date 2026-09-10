<?php

use App\Models\User;

/**
 * En local/testing el manejo custom de excepciones queda desactivado a
 * propósito (para no perder la página de debug de Laravel) — por eso acá
 * forzamos app.env a "production" para probar el comportamiento real. Esto
 * prueba la parte de backend nomás: que la respuesta sea una página de
 * Inertia llamada "error" con el status code correcto. No hace falta que
 * exista resources/js/pages/error.tsx para esto — eso lo resuelve el
 * navegador del lado del cliente, no Laravel.
 */
test('a 404 renders as an inertia "error" page with the right status code', function () {
    app()->instance('env', 'production');

    $response = $this->get('/esta-ruta-no-existe-para-nada');

    $response->assertStatus(404);
    $response->assertInertia(fn ($page) => $page
        ->component('error', false)
        ->where('status', 404)
    );
});

test('a 403 (forbidden) also renders as the inertia error page', function () {
    app()->instance('env', 'production');

    $user = User::factory()->create();

    // Ruta de admin sin ningún rol asignado -> 403 del middleware `role`.
    $response = $this->actingAs($user)->get(route('admin.dashboard'));

    $response->assertStatus(403);
    $response->assertInertia(fn ($page) => $page
        ->component('error', false)
        ->where('status', 403)
    );
});

test('outside of production (ej. testing/local), errors do not get wrapped as the inertia error page', function () {
    $response = $this->get('/esta-ruta-no-existe-para-nada');

    $response->assertStatus(404);
    $response->assertHeaderMissing('X-Inertia');
});
