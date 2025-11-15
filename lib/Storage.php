<?php

namespace SharedLib;

class Storage
{
    public static function read(string $path): array
    {
        if (!is_file($path)) {
            return ['projects' => [], 'filters' => ['statuses' => [], 'priorities' => []]];
        }

        $json = file_get_contents($path);
        $decoded = json_decode($json, true);

        return is_array($decoded) ? $decoded : ['projects' => [], 'filters' => ['statuses' => [], 'priorities' => []]];
    }

    public static function write(string $path, array $payload): void
    {
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        file_put_contents($path, $json);
    }
}
