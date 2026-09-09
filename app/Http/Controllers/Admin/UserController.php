<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\Admin\UserResource;
use App\Models\User;
use App\Services\Admin\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(private readonly UserService $userService) {}

    public function index(Request $request): Response
    {
        $users = User::with('roles')
            ->withCount(['authoredArticles as published_articles_count' => fn ($query) => $query->where('status', 'published')])
            ->latest()
            ->get();

        return Inertia::render('admin/users/index', [
            'users' => $users->map(fn (User $user) => (new UserResource($user))->resolve())->all(),
            'assignableRoles' => $this->userService->assignableRoles($request->user()),
            'kpis' => $this->userService->kpisFrom($users),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->userService->createUser($request->validated());

        return to_route('admin.users.index');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->userService->updateUser($request->user(), $user, $request->validated());

        return to_route('admin.users.index');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->userService->deleteUser($request->user(), $user);

        return to_route('admin.users.index');
    }
}
