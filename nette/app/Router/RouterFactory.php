<?php

declare(strict_types=1);

namespace App\Router;

use Nette\Application\Routers\RouteList;

final class RouterFactory
{
    public static function createRouter(): RouteList
    {
        $router = new RouteList();
        $router->addRoute('sign/in', 'Sign:in');
        $router->addRoute('dashboard[/<id>]', 'Dashboard:default');
        $router->addRoute('<presenter>/<action>', 'Dashboard:default');
        return $router;
    }
}
