<?php

use Illuminate\Support\Facades\Redirect;
use Laravel\Socialite\Facades\Socialite;

beforeEach(function () {
    Socialite::shouldReceive('driver->redirect')
        ->andReturn(Redirect::to('https://accounts.google.com/fake'));
});

test('a local relative return_to is kept as the intended url', function () {
    $this->get('/auth/google?return_to='.urlencode('/tendencias'));

    expect(session('url.intended'))->toBe('/tendencias');
});

test('an absolute external return_to is rejected (open redirect protection)', function () {
    $this->get('/auth/google?return_to='.urlencode('https://sitio-falso.com/robar-sesion'));

    expect(session('url.intended'))->not->toBe('https://sitio-falso.com/robar-sesion');
});

test('a protocol-relative return_to is rejected too', function () {
    $this->get('/auth/google?return_to='.urlencode('//sitio-falso.com'));

    expect(session('url.intended'))->not->toBe('//sitio-falso.com');
});

test('a return_to pointing at the login or google auth routes is ignored', function () {
    $this->get('/auth/google?return_to='.urlencode('/login'));

    expect(session('url.intended'))->not->toBe('/login');
});
