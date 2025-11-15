<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\DataRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function __construct(private readonly DataRepository $repository)
    {
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatePayload($request);
        $this->repository->upsertProject($validated);
        return back()->with('status', 'Project created');
    }

    public function update(Request $request, string $projectId): RedirectResponse
    {
        $validated = $this->validatePayload($request);
        $validated['id'] = $projectId;
        $this->repository->upsertProject($validated);
        return back()->with('status', 'Project updated');
    }

    public function destroy(string $projectId): RedirectResponse
    {
        $this->repository->deleteProject($projectId);
        return back()->with('status', 'Project deleted');
    }

    private function validatePayload(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string'],
            'owner' => ['required', 'string'],
            'status' => ['required', 'string'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'timeline' => ['nullable', 'string'],
        ]);

        $data['progress'] = (int) ($data['progress'] ?? 0);
        return $data;
    }
}
