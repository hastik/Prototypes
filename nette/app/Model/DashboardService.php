<?php

declare(strict_types=1);

namespace App\Model;

final class DashboardService
{
    public function __construct(private readonly DataRepository $repository)
    {
    }

    public function overview(array $filters = []): array
    {
        $data = $this->repository->snapshot();
        $projects = $data['projects'] ?? [];

        $projects = array_filter($projects, function (array $project) use ($filters): bool {
            if ($filters['status'] ?? null) {
                if (($project['status'] ?? '') !== $filters['status']) {
                    return false;
                }
            }
            if ($filters['search'] ?? null) {
                $needle = strtolower($filters['search']);
                $haystack = strtolower(($project['name'] ?? '') . ' ' . ($project['owner'] ?? ''));
                if (!str_contains($haystack, $needle)) {
                    return false;
                }
            }
            return true;
        });

        $projectCount = count($projects);
        $taskCount = 0;
        $blocked = 0;
        $completed = 0;

        foreach ($projects as $project) {
            foreach ($project['tasks'] ?? [] as $task) {
                if (($filters['priority'] ?? null) && $task['priority'] !== $filters['priority']) {
                    continue;
                }
                ++$taskCount;
                if (($task['status'] ?? '') === 'blocked') {
                    ++$blocked;
                }
                if (($task['status'] ?? '') === 'done') {
                    ++$completed;
                }
            }
        }

        $completionRate = $taskCount > 0 ? round(($completed / $taskCount) * 100) : 0;

        return [
            'projects' => array_values($projects),
            'filters' => $data['filters'] ?? [],
            'metrics' => [
                ['label' => 'Projects', 'value' => $projectCount],
                ['label' => 'Tasks', 'value' => $taskCount],
                ['label' => 'Blocked', 'value' => $blocked],
                ['label' => 'Completion', 'value' => $completionRate . '%'],
            ],
        ];
    }
}
