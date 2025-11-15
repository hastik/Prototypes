<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
use SharedLib\Auth;

class AuthController extends Controller
{
    public function showLogin(Request $request): View|RedirectResponse
    {
        if ($request->session()->has('console_user')) {
            return redirect()->route('dashboard');
        }

        return view('auth.login');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'username' => ['required'],
            'password' => ['required'],
        ]);

        if (!Auth::attempt($credentials['username'], $credentials['password'])) {
            return back()->withErrors('Invalid credentials')->withInput();
        }

        $request->session()->put('console_user', $credentials['username']);
        return redirect()->route('dashboard')->with('status', 'Welcome back');
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->forget('console_user');
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('status', 'Signed out');
    }
}
