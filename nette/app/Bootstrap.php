<?php

declare(strict_types=1);

namespace App;

use Nette\Bootstrap\Configurator;

final class Bootstrap
{
    public static function boot(): Configurator
    {
        $configurator = new Configurator();
        $appDir = __DIR__;
        $rootDir = dirname(__DIR__);

        $configurator->setDebugMode(true);
        $configurator->setTimeZone('UTC');
        $configurator->setTempDirectory($rootDir . '/temp');
        $configurator->addStaticParameters([
            'designDir' => dirname($rootDir) . '/design',
            'dataFile' => $appDir . '/data/data.json',
        ]);

        $configurator->addConfig($appDir . '/config/common.neon');

        return $configurator;
    }
}
