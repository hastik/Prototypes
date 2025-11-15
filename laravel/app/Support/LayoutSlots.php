<?php

declare(strict_types=1);

namespace App\Support;

class LayoutSlots
{
    public static function render(array $slots = []): string
    {
        $layoutPath = base_path('design/html/layout.html');
        if (!is_file($layoutPath)) {
            return '<p>Layout missing.</p>';
        }

        $html = file_get_contents($layoutPath);
        foreach ($slots as $slot => $content) {
            $token = sprintf('<!-- SLOT:%s -->', $slot);
            $html = str_replace($token, $content, $html);
        }

        return preg_replace('/<!-- SLOT:[^>]+ -->/', '', $html) ?? $html;
    }
}
