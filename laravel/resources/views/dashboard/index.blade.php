@extends('layouts.app')

@section('auth')
    <form method="post" action="{{ route('logout') }}">
        @csrf
        <span>Signed in as <strong>{{ $username }}</strong></span>
        <button type="submit" class="btn">Sign out</button>
    </form>
@endsection

@section('metrics')
    @foreach($metrics as $metric)
        <div class="metric-card">
            <p>{{ $metric['label'] }}</p>
            <h3>{{ $metric['value'] }}</h3>
        </div>
    @endforeach
@endsection

@section('toolbar')
    <form method="get" class="form-grid form-grid--small">
        <div class="form-group">
            <label>Status</label>
            <select name="status">
                <option value="">All</option>
                @foreach(($filters['statuses'] ?? []) as $status)
                    <option value="{{ $status }}" @selected(($filterValues['status'] ?? null) === $status)>
                        {{ ucfirst($status) }}
                    </option>
                @endforeach
            </select>
        </div>
        <div class="form-group">
            <label>Priority</label>
            <select name="priority">
                <option value="">All</option>
                @foreach(($filters['priorities'] ?? []) as $priority)
                    <option value="{{ $priority }}" @selected(($filterValues['priority'] ?? null) === $priority)>
                        {{ ucfirst($priority) }}
                    </option>
                @endforeach
            </select>
        </div>
        <div class="form-group">
            <label>Search</label>
            <input name="search" placeholder="Project or owner" value="{{ $filterValues['search'] ?? '' }}">
        </div>
        <button type="submit">Apply</button>
    </form>
    @if(session('status'))
        <div class="flash-list">
            <div>{{ session('status') }}</div>
        </div>
    @endif
@endsection

@section('projects')
    @forelse($projects as $project)
        <article class="project-card">
            <header>
                <div>
                    <h3>{{ $project['name'] }}</h3>
                    <small>Owner: {{ $project['owner'] }}</small>
                </div>
                <span class="status-pill" data-state="{{ $project['status'] }}">
                    {{ str_replace('-', ' ', $project['status']) }}
                </span>
            </header>
            <p>Progress: {{ $project['progress'] }}% · Timeline: {{ $project['timeline'] ?? 'tbd' }}</p>
            <p>Tasks: {{ count($project['tasks'] ?? []) }}</p>
            <div class="card-actions">
                <form method="post" action="{{ route('projects.destroy', $project['id']) }}">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="btn btn--ghost">Delete</button>
                </form>
            </div>
            <details>
                <summary>Edit project</summary>
                <form method="post" action="{{ route('projects.update', $project['id']) }}" class="form-grid">
                    @csrf
                    @method('PUT')
                    <input type="hidden" name="id" value="{{ $project['id'] }}">
                    <div class="form-group">
                        <label>Name</label>
                        <input name="name" value="{{ $project['name'] }}" required>
                    </div>
                    <div class="form-group">
                        <label>Owner</label>
                        <input name="owner" value="{{ $project['owner'] }}" required>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status" required>
                            @foreach(($filters['statuses'] ?? []) as $status)
                                <option value="{{ $status }}" @selected($project['status'] === $status)>{{ ucfirst($status) }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Progress</label>
                        <input type="number" name="progress" min="0" max="100" value="{{ $project['progress'] }}">
                    </div>
                    <div class="form-group">
                        <label>Timeline</label>
                        <input name="timeline" value="{{ $project['timeline'] ?? '' }}">
                    </div>
                    <button type="submit">Update</button>
                </form>
            </details>
        </article>
    @empty
        <div class="list-empty">
            <p>No projects yet. Use the form to add one.</p>
        </div>
    @endforelse
@endsection

@section('tasks')
    @forelse($projects as $project)
        <h3>{{ $project['name'] }} tasks</h3>
        @forelse($project['tasks'] ?? [] as $task)
            <article class="task-card">
                <header>
                    <strong>{{ $task['title'] }}</strong>
                    <span class="status-pill" data-state="{{ $task['status'] }}">{{ $task['status'] }}</span>
                </header>
                <p>Assignee: {{ $task['assignee'] }} · Priority: {{ $task['priority'] }}</p>
                <p>Due: {{ $task['dueDate'] ?? 'tbd' }}</p>
                <form method="post" action="{{ route('tasks.destroy', $task['id'] ?? '') }}">
                    @csrf
                    @method('DELETE')
                    <input type="hidden" name="projectId" value="{{ $project['id'] }}">
                    <button type="submit" class="btn btn--ghost">Delete</button>
                </form>
                <details>
                    <summary>Edit task</summary>
                    <form method="post" action="{{ route('tasks.update', $task['id'] ?? '') }}" class="form-grid">
                        @csrf
                        @method('PUT')
                        <input type="hidden" name="projectId" value="{{ $project['id'] }}">
                        <div class="form-group">
                            <label>Title</label>
                            <input name="title" value="{{ $task['title'] }}" required>
                        </div>
                        <div class="form-group">
                            <label>Assignee</label>
                            <input name="assignee" value="{{ $task['assignee'] }}" required>
                        </div>
                        <div class="form-group">
                            <label>Priority</label>
                            <select name="priority" required>
                                @foreach(['low','medium','high'] as $priority)
                                    <option value="{{ $priority }}" @selected($task['priority'] === $priority)>{{ ucfirst($priority) }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select name="status" required>
                                @foreach(($filters['statuses'] ?? []) as $status)
                                    <option value="{{ $status }}" @selected($task['status'] === $status)>{{ ucfirst($status) }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Due date</label>
                            <input name="dueDate" value="{{ $task['dueDate'] ?? '' }}">
                        </div>
                        <button type="submit">Update</button>
                    </form>
                </details>
            </article>
        @empty
            <div class="list-empty">
                <p>No tasks under this project.</p>
            </div>
        @endforelse
    @empty
        <div class="list-empty">
            <p>Add a project to start tracking tasks.</p>
        </div>
    @endforelse
@endsection

@section('forms')
    <section>
        <h3>Create project</h3>
        <form method="post" action="{{ route('projects.store') }}" class="form-grid">
            @csrf
            <div class="form-group">
                <label>Name</label>
                <input name="name" required>
            </div>
            <div class="form-group">
                <label>Owner</label>
                <input name="owner" required>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select name="status" required>
                    <option value="">Select</option>
                    @foreach(($filters['statuses'] ?? []) as $status)
                        <option value="{{ $status }}">{{ ucfirst($status) }}</option>
                    @endforeach
                </select>
            </div>
            <div class="form-group">
                <label>Progress</label>
                <input type="number" name="progress" min="0" max="100" value="0">
            </div>
            <div class="form-group">
                <label>Timeline</label>
                <input name="timeline">
            </div>
            <button type="submit">Save</button>
        </form>
    </section>
    <section>
        <h3>Log task</h3>
        <form method="post" action="{{ route('tasks.store') }}" class="form-grid">
            @csrf
            <div class="form-group">
                <label>Project</label>
                <select name="projectId" required>
                    <option value="">Select project</option>
                    @foreach($projects as $project)
                        <option value="{{ $project['id'] }}">{{ $project['name'] }}</option>
                    @endforeach
                </select>
            </div>
            <div class="form-group">
                <label>Title</label>
                <input name="title" required>
            </div>
            <div class="form-group">
                <label>Assignee</label>
                <input name="assignee" required>
            </div>
            <div class="form-group">
                <label>Priority</label>
                <select name="priority" required>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select name="status" required>
                    @foreach(($filters['statuses'] ?? []) as $status)
                        <option value="{{ $status }}">{{ ucfirst($status) }}</option>
                    @endforeach
                </select>
            </div>
            <div class="form-group">
                <label>Due date</label>
                <input name="dueDate" placeholder="2025-12-01">
            </div>
            <button type="submit">Save</button>
        </form>
    </section>
@endsection

@section('footer')
    <span>Laravel · JSON-backed</span>
@endsection
