@php
    use App\Support\LayoutSlots;

    $slots = [
        'auth' => trim($__env->yieldContent('auth')),
        'metrics' => trim($__env->yieldContent('metrics')),
        'toolbar' => trim($__env->yieldContent('toolbar')),
        'projects' => trim($__env->yieldContent('projects')),
        'tasks' => trim($__env->yieldContent('tasks')),
        'forms' => trim($__env->yieldContent('forms')),
        'footer' => trim($__env->yieldContent('footer')),
    ];
@endphp

{!! LayoutSlots::render(array_filter($slots)) !!}
