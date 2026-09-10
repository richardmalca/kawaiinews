<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\Public\NewsService;
use Inertia\Inertia;
use Inertia\Response;

class LegalController extends Controller
{
    public function __construct(
        private readonly NewsService $newsService
    ) {}

    public function privacy(): Response
    {
        return Inertia::render('public/legal/privacy', [
            'categories' => $this->newsService->getCategoriesSummary(),
        ]);
    }

    public function terms(): Response
    {
        return Inertia::render('public/legal/terms', [
            'categories' => $this->newsService->getCategoriesSummary(),
        ]);
    }

    public function dmca(): Response
    {
        return Inertia::render('public/legal/dmca', [
            'categories' => $this->newsService->getCategoriesSummary(),
        ]);
    }

    public function cookies(): Response
    {
        return Inertia::render('public/legal/cookies', [
            'categories' => $this->newsService->getCategoriesSummary(),
        ]);
    }
}
