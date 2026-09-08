<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(private readonly UserService $userService) {}

    public function index(Request $request): Response
    {
        $users = User::with('roles')->latest()->get();

        return Inertia::render('admin/users/index', [
            'users' => $users->map(fn (User $user) => (new UserResource($user))->resolve())->all(),
            'assignableRoles' => $this->userService->assignableRoles($request->user()),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->userService->createUser($request->validated());

        return to_route('admin.users.index');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->userService->updateUser($user, $request->validated());

        return to_route('admin.users.index');
    }

    public function destroy(User $user): RedirectResponse
    {
        $this->userService->deleteUser($user);

        return to_route('admin.users.index');
    }
}
