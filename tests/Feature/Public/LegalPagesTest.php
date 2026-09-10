<?php

use Inertia\Testing\AssertableInertia as Assert;

test('privacy page renders successfully', function () {
    $this->get(route('legal.privacy'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/legal/privacy')
            ->has('categories')
        );
});

test('terms page renders successfully', function () {
    $this->get(route('legal.terms'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/legal/terms')
            ->has('categories')
        );
});

test('dmca page renders successfully', function () {
    $this->get(route('legal.dmca'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/legal/dmca')
            ->has('categories')
        );
});

test('cookies page renders successfully', function () {
    $this->get(route('legal.cookies'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/legal/cookies')
            ->has('categories')
        );
});
