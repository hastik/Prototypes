<?php

declare(strict_types=1);

namespace App\Services;

use SharedLib\Storage;

class DataRepository
{
    public function __construct(private readonly ?string $path = null)
    {
    }

    private function path(): string
    {
        return $this->path ?? storage_path('app/data.json');
    }

    public function snapshot(): array
    {
        return Storage::read($this->path());
    }

    public function save(array $payload): void
    {
        Storage::write($this->path(), $payload);
    }

    public function upsertProject(array $project): array
    {
        $data = $this->snapshot();
        $project['id'] = $project['id'] ?? $this->generateId('proj');
        $project['tasks'] = $project['tasks'] ?? [];

        $data['projects'] = array_values(array_filter(
            $data['projects'] ?? [],
            fn ($item) => $item['id'] !== $project['id']
        ));
        $data['projects'][] = $project;
        $this->save($data);

        return $project;
    }

    public function deleteProject(string $projectId): void
    {
        $data = $this->snapshot();
        $data['projects'] = array_values(array_filter(
            $data['projects'] ?? [],
            fn ($item) => $item['id'] !== $projectId
        ));
        $this->save($data);
    }

    public function upsertTask(string $projectId, array $task): array
    {
        $data = $this->snapshot();
        $task['id'] = $task['id'] ?? $this->generateId('task');

        foreach ($data['projects'] as &$project) {
            if ($project['id'] === $projectId) {
                $project['tasks'] = array_values(array_filter(
                    $project['tasks'] ?? [],
                    fn ($item) => $item['id'] !== $task['id']
                ));
                $project['tasks'][] = $task;
                break;
            }
        }
        unset($project);

        $this->save($data);
        return $task;
    }

    public function deleteTask(string $projectId, string $taskId): void
    {
        $data = $this->snapshot();
        foreach ($data['projects'] as &$project) {
            if ($project['id'] === $projectId) {
                $project['tasks'] = array_values(array_filter(
                    $project['tasks'] ?? [],
                    fn ($item) => $item['id'] !== $taskId
                ));
            }
        }
        unset($project);
        $this->save($data);
    }

    public function overview(array $filters = []): array
    {
        $data = $this->snapshot();
        $projects = $data['projects'] ?? [];

        $projects = array_filter($projects, function (array $project) use ($filters) {
            if (!empty($filters['status']) && ($project['status'] ?? null) !== $filters['status']) {
                return false;
            }
            if (!empty($filters['search'])) {
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
        $completed = 0;
        $blocked = 0;

        foreach ($projects as $project) {
            foreach ($project['tasks'] ?? [] as $task) {
                if (!empty($filters['priority']) && ($task['priority'] ?? null) !== $filters['priority']) {
                    continue;
                }
                ++$taskCount;
                if (($task['status'] ?? '') === 'done') {
                    ++$completed;
                }
                if (($task['status'] ?? '') === 'blocked') {
                    ++$blocked;
                }
            }
        }

        $metrics = [
            ['label' => 'Projects', 'value' => $projectCount],
            ['label' => 'Tasks', 'value' => $taskCount],
            ['label' => 'Blocked', 'value' => $blocked],
            ['label' => 'Completion', 'value' => $taskCount ? round(($completed / $taskCount) * 100) . '%' : '0%'],
        ];

        return [
            'projects' => array_values($projects),
            'metrics' => $metrics,
            'filters' => $data['filters'] ?? [],
        ];
    }

    private function generateId(string $prefix): string
    {
        return sprintf('%s-%s', $prefix, substr(bin2hex(random_bytes(4)), 0, 8));
    }
}
