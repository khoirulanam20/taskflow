<?php

namespace App\Http\Controllers;

use App\Support\Inertia\SharedDataProvider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function __construct(private readonly SharedDataProvider $shared) {}

    public function index(Request $request): Response
    {
        return Inertia::render('Notifications/Index', [
            'notifications' => $request->user()->notifications()->paginate($request->integer('per_page', 10)),
        ]);
    }

    public function preview(Request $request): JsonResponse
    {
        return response()->json($this->shared->notificationPreview() ?? [
            'unread_count' => 0,
            'recent' => [],
        ]);
    }

    public function markAsRead(string $notificationId, Request $request): JsonResponse|RedirectResponse
    {
        $request->user()
            ->notifications()
            ->whereKey($notificationId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        if ($request->expectsJson()) {
            return response()->json($this->shared->notificationPreview());
        }

        return back();
    }

    public function destroy(string $notificationId, Request $request): JsonResponse|RedirectResponse
    {
        $request->user()
            ->notifications()
            ->whereKey($notificationId)
            ->delete();

        if ($request->expectsJson()) {
            return response()->json($this->shared->notificationPreview());
        }

        return back();
    }
}
