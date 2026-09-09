<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\Public\NewsService;
use App\Services\Public\ProfileService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        private readonly ProfileService $profileService,
        private readonly NewsService $newsService,
    ) {}

    public function show(Request $request, string $username): Response
    {
        $profileUser = $this->profileService->findByUsername($username);

        return Inertia::render('public/profile/show', [
            'profile' => $this->profileService->buildProfile($profileUser, $request->user()),
            'categories' => $this->newsService->getCategoriesSummary(),
        ]);
    }
}
