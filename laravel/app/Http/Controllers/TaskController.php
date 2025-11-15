<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\DataRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function __construct(private readonly DataRepository $repository)
    {
    }

    public function store(Request $request): RedirectResponse
    {
        [$projectId, $task] = $this->validatePayload($request);
        $this->repository->upsertTask($projectId, $task);
        return back()->with('status', 'Task created');
    }

    public function update(Request $request, string $taskId): RedirectResponse
    {
        [$projectId, $task] = $this->validatePayload($request);
        $task['id'] = $taskId;
        $this->repository->upsertTask($projectId, $task);
        return back()->with('status', 'Task updated');
    }

    public function destroy(Request $request, string $taskId): RedirectResponse
    {
        $projectId = $request->input('projectId');
        if ($projectId) {
            $this->repository->deleteTask($projectId, $taskId);
        }

        return back()->with('status', 'Task deleted');
    }

    private function validatePayload(Request $request): array
    {
        $data = $request->validate([
            'projectId' => ['required', 'string'],
            'title' => ['required', 'string'],
            'assignee' => ['required', 'string'],
            'priority' => ['required', 'string'],
            'status' => ['required', 'string'],
            'dueDate' => ['nullable', 'string'],
        ]);

        $projectId = $data['projectId'];
        unset($data['projectId']);

        return [$projectId, $data];
    }
}
