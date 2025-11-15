<?php

declare(strict_types=1);

namespace App\Model;

use SharedLib\Storage;

final class DataRepository
{
    public function __construct(private readonly string $dataFile)
    {
    }

    public function snapshot(): array
    {
        return Storage::read($this->dataFile);
    }

    public function save(array $payload): void
    {
        Storage::write($this->dataFile, $payload);
    }

    public function upsertProject(array $project): array
    {
        $data = $this->snapshot();
        $project['id'] ??= $this->generateId('proj');

        $data['projects'] = array_values(array_filter(
            $data['projects'] ?? [],
            static fn ($item) => $item['id'] !== $project['id']
        ));

        $project['tasks'] ??= [];
        $data['projects'][] = $project;
        $this->save($data);

        return $project;
    }

    public function deleteProject(string $projectId): void
    {
        $data = $this->snapshot();
        $data['projects'] = array_values(array_filter(
            $data['projects'] ?? [],
            static fn ($item) => $item['id'] !== $projectId
        ));
        $this->save($data);
    }

    public function upsertTask(string $projectId, array $task): void
    {
        $data = $this->snapshot();
        $task['id'] ??= $this->generateId('task');

        foreach ($data['projects'] as &$project) {
            if ($project['id'] === $projectId) {
                $project['tasks'] ??= [];
                $project['tasks'] = array_values(array_filter(
                    $project['tasks'],
                    static fn ($item) => $item['id'] !== $task['id']
                ));
                $project['tasks'][] = $task;
                break;
            }
        }
        unset($project);

        $this->save($data);
    }

    public function deleteTask(string $projectId, string $taskId): void
    {
        $data = $this->snapshot();
        foreach ($data['projects'] as &$project) {
            if ($project['id'] === $projectId) {
                $project['tasks'] = array_values(array_filter(
                    $project['tasks'] ?? [],
                    static fn ($item) => $item['id'] !== $taskId
                ));
                break;
            }
        }
        unset($project);
        $this->save($data);
    }

    private function generateId(string $prefix): string
    {
        return sprintf('%s-%s', $prefix, substr(bin2hex(random_bytes(3)), 0, 6));
    }
}
