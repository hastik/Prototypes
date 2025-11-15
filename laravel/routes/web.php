<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function () {
    Route::redirect('/', '/login');

    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.perform');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::middleware('console.auth')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
        Route::put('/projects/{projectId}', [ProjectController::class, 'update'])->name('projects.update');
        Route::delete('/projects/{projectId}', [ProjectController::class, 'destroy'])->name('projects.destroy');

        Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
        Route::put('/tasks/{taskId}', [TaskController::class, 'update'])->name('tasks.update');
        Route::delete('/tasks/{taskId}', [TaskController::class, 'destroy'])->name('tasks.destroy');
    });
});
