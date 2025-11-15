const STORAGE_KEY = 'todoAppData';
const USER_KEY = 'todoAppUser';
const seedData = {
  projects: [
    {
      id: 'proj-100',
      name: 'Website Revamp',
      owner: 'Maya',
      status: 'in-progress',
      progress: 42,
      timeline: 'Q4',
      tasks: [
        {
          id: 'task-1',
          title: 'Refresh hero visuals',
          assignee: 'Nico',
          priority: 'high',
          status: 'in-progress',
          dueDate: '2025-12-01'
        },
        {
          id: 'task-2',
          title: 'Write launch brief',
          assignee: 'Sam',
          priority: 'medium',
          status: 'backlog',
          dueDate: '2025-12-10'
        }
      ]
    },
    {
      id: 'proj-200',
      name: 'API Hardening',
      owner: 'Ivy',
      status: 'blocked',
      progress: 15,
      timeline: 'Rolling',
      tasks: [
        {
          id: 'task-3',
          title: 'Add rate limiting',
          assignee: 'Jo',
          priority: 'high',
          status: 'blocked',
          dueDate: '2025-11-30'
        },
        {
          id: 'task-4',
          title: 'Blueprint tracing',
          assignee: 'Lia',
          priority: 'low',
          status: 'done',
          dueDate: '2025-11-18'
        }
      ]
    }
  ],
  filters: {
    statuses: ['backlog', 'in-progress', 'blocked', 'done'],
    priorities: ['low', 'medium', 'high']
  }
};

function deepClone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

const state = {
  user: loadUser(),
  data: loadData(),
  filters: { status: '', priority: '', search: '' },
  ui: {
    editingProjectId: null,
    editingTask: null
  }
};

const slots = {
  auth: document.querySelector('[data-slot="auth"]'),
  metrics: document.querySelector('[data-slot="metrics"]'),
  toolbar: document.querySelector('[data-slot="toolbar"]'),
  projects: document.querySelector('[data-slot="projects"]'),
  tasks: document.querySelector('[data-slot="tasks"]'),
  forms: document.querySelector('[data-slot="forms"]'),
  footer: document.querySelector('[data-slot="footer"]')
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
      return deepClone(seedData);
    }
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse stored data', error);
    return deepClone(seedData);
  }
}

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) ?? null;
  } catch (error) {
    console.warn('Failed to parse user', error);
    return null;
  }
}

function persistData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function persistUser() {
  if (state.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(state.user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

function cloneData() {
  return deepClone(state.data);
}

function generateId(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}`;
}

function applyProjectFilters(projects) {
  return projects.filter((project) => {
    if (state.filters.status && project.status !== state.filters.status) {
      return false;
    }
    if (state.filters.search) {
      const needle = state.filters.search.toLowerCase();
      const hay = `${project.name} ${project.owner}`.toLowerCase();
      if (!hay.includes(needle)) {
        return false;
      }
    }
    return true;
  });
}

function filteredTasks(project) {
  return (project.tasks ?? []).filter((task) => {
    if (state.filters.priority && task.priority !== state.filters.priority) {
      return false;
    }
    return true;
  });
}

function computeMetrics(projects) {
  const taskTotals = projects.reduce(
    (acc, project) => {
      project.tasks?.forEach((task) => {
        if (state.filters.priority && task.priority !== state.filters.priority) {
          return;
        }
        acc.total += 1;
        if (task.status === 'blocked') acc.blocked += 1;
        if (task.status === 'done') acc.completed += 1;
      });
      return acc;
    },
    { total: 0, completed: 0, blocked: 0 }
  );

  const completion = taskTotals.total
    ? `${Math.round((taskTotals.completed / taskTotals.total) * 100)}%`
    : '0%';

  return [
    { label: 'Projects', value: projects.length },
    { label: 'Tasks', value: taskTotals.total },
    { label: 'Blocked', value: taskTotals.blocked },
    { label: 'Completion', value: completion }
  ];
}

function setUser(username) {
  state.user = username ? { name: username } : null;
  persistUser();
  render();
}

function upsertProject(payload) {
  const data = cloneData();
  if (!payload.id) {
    payload.id = generateId('proj');
    payload.tasks = [];
    data.projects.push(payload);
  } else {
    const idx = data.projects.findIndex((project) => project.id === payload.id);
    if (idx >= 0) {
      data.projects[idx] = { ...data.projects[idx], ...payload };
    }
  }
  state.data = data;
  state.ui.editingProjectId = null;
  persistData();
  render();
}

function deleteProject(projectId) {
  const data = cloneData();
  data.projects = data.projects.filter((project) => project.id !== projectId);
  state.data = data;
  if (state.ui.editingProjectId === projectId) {
    state.ui.editingProjectId = null;
  }
  if (state.ui.editingTask?.projectId === projectId) {
    state.ui.editingTask = null;
  }
  persistData();
  render();
}

function upsertTask(projectId, payload) {
  const data = cloneData();
  const project = data.projects.find((p) => p.id === projectId);
  if (!project) return;
  if (!payload.id) {
    payload.id = generateId('task');
    project.tasks = project.tasks ?? [];
    project.tasks.push(payload);
  } else {
    project.tasks = project.tasks ?? [];
    const idx = project.tasks.findIndex((task) => task.id === payload.id);
    if (idx >= 0) {
      project.tasks[idx] = { ...project.tasks[idx], ...payload };
    }
  }
  state.data = data;
  state.ui.editingTask = null;
  persistData();
  render();
}

function deleteTask(projectId, taskId) {
  const data = cloneData();
  const project = data.projects.find((p) => p.id === projectId);
  if (!project) return;
  project.tasks = (project.tasks ?? []).filter((task) => task.id !== taskId);
  state.data = data;
  if (state.ui.editingTask && state.ui.editingTask.projectId === projectId && state.ui.editingTask.taskId === taskId) {
    state.ui.editingTask = null;
  }
  persistData();
  render();
}

function renderAuth() {
  if (!slots.auth) return;
  if (!state.user) {
    slots.auth.innerHTML = '<span>Guest</span>';
    return;
  }
  slots.auth.innerHTML = `
    <span>Signed in as <strong>${state.user.name}</strong></span>
    <button data-action="logout">Logout</button>
  `;
}

function renderMetrics(projects) {
  if (!slots.metrics) return;
  const metrics = computeMetrics(projects);
  slots.metrics.innerHTML = metrics
    .map(
      (metric) => `
      <div class="metric-card">
        <p>${metric.label}</p>
        <h3>${metric.value}</h3>
      </div>
    `
    )
    .join('');
}

function renderToolbar(filters) {
  if (!slots.toolbar) return;
  const { statuses = [], priorities = [] } = state.data.filters ?? {};
  slots.toolbar.innerHTML = `
    <form class="form-grid form-grid--small" data-form="filters">
      <div class="form-group">
        <label>Status</label>
        <select name="status">
          <option value="">All</option>
          ${statuses
            .map(
              (status) => `
                <option value="${status}" ${state.filters.status === status ? 'selected' : ''}>
                  ${status}
                </option>
              `
            )
            .join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Priority</label>
        <select name="priority">
          <option value="">All</option>
          ${priorities
            .map(
              (priority) => `
                <option value="${priority}" ${state.filters.priority === priority ? 'selected' : ''}>
                  ${priority}
                </option>
              `
            )
            .join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Search</label>
        <input name="search" value="${state.filters.search}" placeholder="Project or owner" />
      </div>
      <button type="submit">Apply</button>
    </form>
  `;
}

function renderProjects(projects) {
  if (!slots.projects) return;
  if (!state.user) {
    slots.projects.innerHTML = '<div class="list-empty"><p>Sign in to see projects.</p></div>';
    return;
  }
  if (!projects.length) {
    slots.projects.innerHTML = '<div class="list-empty"><p>No projects yet.</p></div>';
    return;
  }
  slots.projects.innerHTML = projects
    .map((project) => {
      const taskCount = project.tasks?.length ?? 0;
      return `
        <article class="project-card">
          <header>
            <div>
              <h3>${project.name}</h3>
              <small>Owner: ${project.owner}</small>
            </div>
            <span class="status-pill" data-state="${project.status}">${project.status}</span>
          </header>
          <p>Progress: ${project.progress}% · Timeline: ${project.timeline ?? 'tbd'}</p>
          <p>Tasks: ${taskCount}</p>
          <div class="card-actions">
            <button class="btn btn--ghost" data-action="edit-project" data-project-id="${project.id}">Edit</button>
            <button class="btn btn--ghost" data-action="delete-project" data-project-id="${project.id}">Delete</button>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderTasks(projects) {
  if (!slots.tasks) return;
  if (!state.user) {
    slots.tasks.innerHTML = '<div class="list-empty"><p>Sign in to work with tasks.</p></div>';
    return;
  }
  if (!projects.length) {
    slots.tasks.innerHTML = '<div class="list-empty"><p>No matching projects.</p></div>';
    return;
  }
  const html = projects
    .map((project) => {
      const tasks = filteredTasks(project);
      if (!tasks.length) {
        return `
          <div class="list-empty">
            <p>No tasks under ${project.name} for this view.</p>
          </div>
        `;
      }
      return `
        <section>
          <h3>${project.name}</h3>
          ${tasks
            .map(
              (task) => `
                <article class="task-card">
                  <header>
                    <strong>${task.title}</strong>
                    <span class="status-pill" data-state="${task.status}">${task.status}</span>
                  </header>
                  <p>Assignee: ${task.assignee} · Priority: ${task.priority}</p>
                  <p>Due: ${task.dueDate ?? 'tbd'}</p>
                  <div class="card-actions">
                    <button class="btn btn--ghost"
                            data-action="edit-task"
                            data-project-id="${project.id}"
                            data-task-id="${task.id}">Edit</button>
                    <button class="btn btn--ghost"
                            data-action="delete-task"
                            data-project-id="${project.id}"
                            data-task-id="${task.id}">Delete</button>
                  </div>
                </article>
              `
            )
            .join('')}
        </section>
      `;
    })
    .join('');
  slots.tasks.innerHTML = html;
}

function renderForms(projects) {
  if (!slots.forms) return;
  if (!state.user) {
    slots.forms.innerHTML = `
      <h3>Sign in</h3>
      <form data-form="login" class="form-grid">
        <div class="form-group">
          <label>Username</label>
          <input name="username" value="admin" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input name="password" type="password" value="1234" />
        </div>
        <button type="submit">Access console</button>
      </form>
    `;
    return;
  }

  const activeProject = state.ui.editingProjectId
    ? state.data.projects.find((p) => p.id === state.ui.editingProjectId)
    : null;
  const editingTask = state.ui.editingTask
    ? findTask(state.ui.editingTask.projectId, state.ui.editingTask.taskId)
    : null;

  slots.forms.innerHTML = `
    <section>
      <h3>${activeProject ? 'Edit project' : 'New project'}</h3>
      <form data-form="project" class="form-grid">
        <input type="hidden" name="projectId" value="${activeProject?.id ?? ''}" />
        <div class="form-group">
          <label>Name</label>
          <input name="name" value="${activeProject?.name ?? ''}" required />
        </div>
        <div class="form-group">
          <label>Owner</label>
          <input name="owner" value="${activeProject?.owner ?? ''}" required />
        </div>
        <div class="form-group">
          <label>Status</label>
          <select name="status" required>
            <option value="">Select</option>
            ${(state.data.filters?.statuses ?? [])
              .map(
                (status) => `
                  <option value="${status}" ${activeProject?.status === status ? 'selected' : ''}>
                    ${status}
                  </option>
                `
              )
              .join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Progress %</label>
          <input type="number" name="progress" min="0" max="100" value="${activeProject?.progress ?? 0}" />
        </div>
        <div class="form-group">
          <label>Timeline</label>
          <input name="timeline" value="${activeProject?.timeline ?? ''}" />
        </div>
        <button type="submit">${activeProject ? 'Update' : 'Create'}</button>
        ${activeProject ? '<button type="button" data-action="cancel-project">Cancel</button>' : ''}
      </form>
    </section>
    <section>
      <h3>${editingTask ? 'Edit task' : 'New task'}</h3>
      <form data-form="task" class="form-grid">
        <input type="hidden" name="taskId" value="${editingTask?.task?.id ?? ''}" />
        <div class="form-group">
          <label>Project</label>
          <select name="projectId" required>
            <option value="">Select project</option>
            ${state.data.projects
              .map(
                (project) => `
                  <option value="${project.id}" ${
                    editingTask?.project?.id === project.id ? 'selected' : ''
                  }>
                    ${project.name}
                  </option>
                `
              )
              .join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Title</label>
          <input name="title" value="${editingTask?.task?.title ?? ''}" required />
        </div>
        <div class="form-group">
          <label>Assignee</label>
          <input name="assignee" value="${editingTask?.task?.assignee ?? ''}" required />
        </div>
        <div class="form-group">
          <label>Priority</label>
          <select name="priority" required>
            ${(state.data.filters?.priorities ?? [])
              .map(
                (priority) => `
                  <option value="${priority}" ${editingTask?.task?.priority === priority ? 'selected' : ''}>
                    ${priority}
                  </option>
                `
              )
              .join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select name="status" required>
            ${(state.data.filters?.statuses ?? [])
              .map(
                (status) => `
                  <option value="${status}" ${editingTask?.task?.status === status ? 'selected' : ''}>
                    ${status}
                  </option>
                `
              )
              .join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Due date</label>
          <input name="dueDate" value="${editingTask?.task?.dueDate ?? ''}" />
        </div>
        <button type="submit">${editingTask ? 'Update' : 'Create'}</button>
        ${editingTask ? '<button type="button" data-action="cancel-task">Cancel</button>' : ''}
      </form>
    </section>
  `;
}

function renderFooter() {
  if (!slots.footer) return;
  slots.footer.innerHTML = '<span>Vanilla JS · LocalStorage</span>';
}

function findTask(projectId, taskId) {
  const project = state.data.projects.find((p) => p.id === projectId);
  if (!project) return null;
  const task = (project.tasks ?? []).find((t) => t.id === taskId);
  return task ? { project, task } : null;
}

function handleAuthClick(event) {
  if (event.target?.dataset.action === 'logout') {
    state.user = null;
    persistUser();
    state.ui.editingProjectId = null;
    state.ui.editingTask = null;
    render();
  }
}

function handleProjectActions(event) {
  const { action, projectId } = event.target?.dataset ?? {};
  if (!action || !projectId) return;
  if (action === 'delete-project') {
    deleteProject(projectId);
  }
  if (action === 'edit-project') {
    state.ui.editingProjectId = projectId;
    render();
  }
}

function handleTaskActions(event) {
  const { action, projectId, taskId } = event.target?.dataset ?? {};
  if (!action || !projectId) return;
  if (action === 'delete-task' && taskId) {
    deleteTask(projectId, taskId);
  }
  if (action === 'edit-task' && taskId) {
    state.ui.editingTask = { projectId, taskId };
    render();
  }
}

function wireGlobalEvents() {
  slots.auth?.addEventListener('click', handleAuthClick);
  slots.projects?.addEventListener('click', handleProjectActions);
  slots.tasks?.addEventListener('click', handleTaskActions);
  slots.forms?.addEventListener('submit', (event) => {
    const formType = event.target?.dataset.form;
    if (!formType) return;
    event.preventDefault();
    if (formType === 'login') {
      const formData = new FormData(event.target);
      const username = formData.get('username');
      const password = formData.get('password');
      if (username === 'admin' && password === '1234') {
        setUser(username);
      } else {
        alert('Invalid credentials');
      }
    }
    if (formType === 'project') {
      const data = new FormData(event.target);
      const payload = {
        id: data.get('projectId') || undefined,
        name: data.get('name').trim(),
        owner: data.get('owner').trim(),
        status: data.get('status'),
        progress: Number(data.get('progress') || 0),
        timeline: data.get('timeline') || null
      };
      upsertProject(payload);
      event.target.reset();
    }
    if (formType === 'task') {
      const data = new FormData(event.target);
      const payload = {
        id: data.get('taskId') || undefined,
        projectId: data.get('projectId'),
        title: data.get('title').trim(),
        assignee: data.get('assignee').trim(),
        priority: data.get('priority'),
        status: data.get('status'),
        dueDate: data.get('dueDate') || null
      };
      if (!payload.projectId) {
        alert('Choose a project for the task');
        return;
      }
      const { projectId, ...task } = payload;
      upsertTask(projectId, task);
      event.target.reset();
    }
  });

  slots.forms?.addEventListener('click', (event) => {
    if (event.target?.dataset.action === 'cancel-project') {
      state.ui.editingProjectId = null;
      render();
    }
    if (event.target?.dataset.action === 'cancel-task') {
      state.ui.editingTask = null;
      render();
    }
  });

  slots.toolbar?.addEventListener('submit', (event) => {
    if (event.target?.dataset.form === 'filters') {
      event.preventDefault();
      const formData = new FormData(event.target);
      state.filters = {
        status: formData.get('status') ?? '',
        priority: formData.get('priority') ?? '',
        search: formData.get('search')?.trim() ?? ''
      };
      render();
    }
  });
}

function render() {
  const projects = state.user ? applyProjectFilters(state.data.projects ?? []) : [];
  renderAuth();
  renderMetrics(projects);
  renderToolbar(state.filters);
  renderProjects(projects);
  renderTasks(projects);
  renderForms(projects);
  renderFooter();
}

render();
wireGlobalEvents();
