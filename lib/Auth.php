<?php

namespace SharedLib;

class Auth
{
    private const USERS = [
        'admin' => '1234',
    ];

    public static function attempt(string $username, string $password): bool
    {
        $expected = self::USERS[$username] ?? null;
        if ($expected === null) {
            return false;
        }

        // Plaintext for demo purposes per requirements
        return hash_equals($expected, $password);
    }

    public static function users(): array
    {
        return array_keys(self::USERS);
    }
}
