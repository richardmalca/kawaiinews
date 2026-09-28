<?php

namespace App\Services\Public;

use App\Models\NewsArticle;
use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class PushNotificationService
{
    /**
     * Manda la notificacion de forma sincronica (no hay queue worker
     * confirmado corriendo para este proyecto en el servidor -- son pocas
     * suscripciones todavia, así que es aceptable pagar el costo en el
     * mismo request que publica el articulo en vez de arriesgarse a que
     * quede encolado sin procesar).
     */
    public function notifyArticlePublished(NewsArticle $article): void
    {
        $publicKey = config('services.webpush.public_key');
        $privateKey = config('services.webpush.private_key');
        $subject = config('services.webpush.subject');

        if (! $publicKey || ! $privateKey) {
            return;
        }

        $subscriptions = PushSubscription::all();

        if ($subscriptions->isEmpty()) {
            return;
        }

        $webPush = new WebPush([
            'VAPID' => [
                'subject' => $subject,
                'publicKey' => $publicKey,
                'privateKey' => $privateKey,
            ],
        ]);

        $frontendUrl = rtrim(config('services.kawaiinews_next.url'), '/');
        $payload = json_encode([
            'title' => $article->title,
            'body' => $article->excerpt,
            'url' => "{$frontendUrl}/noticias/{$article->slug}",
            'icon' => $article->featured_image,
        ]);

        foreach ($subscriptions as $subscription) {
            $webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $subscription->endpoint,
                    'publicKey' => $subscription->public_key,
                    'authToken' => $subscription->auth_token,
                    'contentEncoding' => $subscription->content_encoding,
                ]),
                $payload
            );
        }

        $expiredIds = [];

        foreach ($webPush->flush() as $report) {
            if ($report->isSuccess()) {
                continue;
            }

            // 404/410: el navegador invalidó la suscripción (usuario
            // desinstaló, borró datos, revocó el permiso). Limpiar en vez
            // de seguir intentando mandarle para siempre.
            $statusCode = $report->getResponse()?->getStatusCode();
            if (in_array($statusCode, [404, 410], true)) {
                $endpoint = $report->getRequest()->getUri()->__toString();
                $expiredIds[] = $endpoint;
            } else {
                Log::warning('[PushNotificationService] Fallo al enviar push', [
                    'endpoint' => (string) $report->getRequest()->getUri(),
                    'reason' => $report->getReason(),
                ]);
            }
        }

        if ($expiredIds !== []) {
            $hashes = array_map(fn (string $endpoint) => hash('sha256', $endpoint), $expiredIds);
            PushSubscription::whereIn('endpoint_hash', $hashes)->delete();
        }
    }
}
