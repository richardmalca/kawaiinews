<?php

use App\Services\CloudflareCacheService;
use Illuminate\Support\Facades\Http;

test('it purges the given urls through the Cloudflare API when credentials are configured', function () {
    config(['services.cloudflare.api_token' => 'test-token', 'services.cloudflare.zone_id' => 'zone-123']);
    Http::fake(['api.cloudflare.com/*' => Http::response(['success' => true], 200)]);

    app(CloudflareCacheService::class)->purgeUrls(['https://kawaiinews.net/noticias/algo']);

    Http::assertSent(function ($request) {
        return $request->url() === 'https://api.cloudflare.com/client/v4/zones/zone-123/purge_cache'
            && $request['files'] === ['https://kawaiinews.net/noticias/algo']
            && $request->hasHeader('Authorization', 'Bearer test-token');
    });
});

test('it does nothing when Cloudflare credentials are not configured', function () {
    config(['services.cloudflare.api_token' => null, 'services.cloudflare.zone_id' => null]);
    Http::fake();

    app(CloudflareCacheService::class)->purgeUrls(['https://kawaiinews.net/noticias/algo']);

    Http::assertNothingSent();
});

test('it does nothing when given an empty list of urls', function () {
    config(['services.cloudflare.api_token' => 'test-token', 'services.cloudflare.zone_id' => 'zone-123']);
    Http::fake();

    app(CloudflareCacheService::class)->purgeUrls([]);

    Http::assertNothingSent();
});

test('a failed purge request is logged and does not throw', function () {
    config(['services.cloudflare.api_token' => 'test-token', 'services.cloudflare.zone_id' => 'zone-123']);
    Http::fake(['api.cloudflare.com/*' => Http::response(['success' => false], 400)]);

    app(CloudflareCacheService::class)->purgeUrls(['https://kawaiinews.net/noticias/algo']);

    Http::assertSentCount(1);
});
