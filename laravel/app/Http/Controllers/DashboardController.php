<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\DataRepository;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __construct(private readonly DataRepository $repository)
    {
    }

    public function index(Request $request): View
    {
        $filters = $request->only(['status', 'priority', 'search']);
        $overview = $this->repository->overview(array_filter($filters));

        return view('dashboard.index', [
            'projects' => $overview['projects'],
            'metrics' => $overview['metrics'],
            'filters' => $overview['filters'],
            'filterValues' => array_filter($filters),
            'username' => $request->session()->get('console_user'),
        ]);
    }
}
