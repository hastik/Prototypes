@extends('layouts.app')

@section('auth')
    <div>
        <strong>Guest</strong>
        <a href="{{ route('login') }}" class="btn">Sign in</a>
    </div>
@endsection

@section('metrics')
    <div class="metric-card">
        <p>Account</p>
        <h3>Admin</h3>
    </div>
@endsection

@section('toolbar')
    <p>Authenticate with <code>admin / 1234</code> to unlock the dashboard.</p>
@endsection

@section('projects')
    <div class="list-empty">
        <p>Projects appear after authentication.</p>
    </div>
@endsection

@section('tasks')
    <div class="list-empty">
        <p>Tasks appear after authentication.</p>
    </div>
@endsection

@section('forms')
    <h3>Sign in</h3>
    <form method="post" action="{{ route('login.perform') }}" class="form-grid">
        @csrf
        <div class="form-group">
            <label for="username">Username</label>
            <input id="username" name="username" value="{{ old('username', 'admin') }}">
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" name="password" value="1234">
        </div>
        <button type="submit">Access console</button>
        @if($errors->any())
            <ul>
                @foreach($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        @endif
    </form>
@endsection

@section('footer')
    <span>Laravel · Shared layout</span>
@endsection
