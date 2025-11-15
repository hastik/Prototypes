<?php

declare(strict_types=1);

namespace App\Model;

use Nette\Security\AuthenticationException;
use Nette\Security\Authenticator;
use Nette\Security\SimpleIdentity;
use SharedLib\Auth;

final class Authenticator implements Authenticator
{
    public function authenticate(string $username, string $password): SimpleIdentity
    {
        if (!Auth::attempt($username, $password)) {
            throw new AuthenticationException('Invalid credentials');
        }

        return new SimpleIdentity($username, roles: ['admin']);
    }
}
