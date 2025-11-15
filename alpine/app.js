const STORAGE_KEY = 'alpineAppData';
const USER_KEY = 'alpineAppUser';
const seedPayload = {
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

const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPayload));
      return JSON.parse(JSON.stringify(seedPayload));
    }
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Resetting Alpine data', error);
    return JSON.parse(JSON.stringify(seedPayload));
  }
};

const saveData = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const loadUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) ?? null;
  } catch (error) {
    return null;
  }
};

const saveUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

const blankProject = () => ({ id: '', name: '', owner: '', status: '', progress: 0, timeline: '' });
const blankTask = () => ({ id: '', projectId: '', title: '', assignee: '', priority: 'medium', status: 'backlog', dueDate: '' });

const generateId = (prefix) => `${prefix}-${Math.random().toString(16).slice(2, 8)}`;

const deepClone = (payload) => JSON.parse(JSON.stringify(payload));

document.addEventListener('alpine:init', () => {
  Alpine.store('app', {
    data: loadData(),
    user: loadUser(),
    filters: { status: '', priority: '', search: '' },
    projectForm: blankProject(),
    taskForm: blankTask(),

    get statuses() {
      return this.data.filters?.statuses ?? [];
    },
    get priorities() {
      return this.data.filters?.priorities ?? [];
    },
    get isAuthed() {
      return !!this.user;
    },

    metrics() {
      const projects = this.filteredProjects();
      const totals = projects.reduce(
        (acc, project) => {
          (project.tasks ?? []).forEach((task) => {
            if (this.filters.priority && task.priority !== this.filters.priority) {
              return;
            }
            acc.total += 1;
            if (task.status === 'blocked') acc.blocked += 1;
            if (task.status === 'done') acc.completed += 1;
          });
          return acc;
        },
        { total: 0, blocked: 0, completed: 0 }
      );
      const completion = totals.total ? `${Math.round((totals.completed / totals.total) * 100)}%` : '0%';
      return [
        { label: 'Projects', value: projects.length },
        { label: 'Tasks', value: totals.total },
        { label: 'Blocked', value: totals.blocked },
        { label: 'Completion', value: completion }
      ];
    },

    filteredProjects() {
      if (!this.isAuthed) return [];
      return (this.data.projects ?? []).filter((project) => {
        if (this.filters.status && project.status !== this.filters.status) {
          return false;
        }
        if (this.filters.search) {
          const hay = `${project.name} ${project.owner}`.toLowerCase();
          if (!hay.includes(this.filters.search.toLowerCase())) {
            return false;
          }
        }
        return true;
      });
    },

    filteredTasks(project) {
      return (project.tasks ?? []).filter((task) => {
        if (this.filters.priority && task.priority !== this.filters.priority) {
          return false;
        }
        return true;
      });
    },

    applyFilter(event) {
      const formData = new FormData(event.target);
      this.filters = {
        status: formData.get('status') ?? '',
        priority: formData.get('priority') ?? '',
        search: formData.get('search')?.trim() ?? ''
      };
    },

    login(event) {
      const formData = new FormData(event.target);
      const username = formData.get('username');
      const password = formData.get('password');
      if (username === 'admin' && password === '1234') {
        this.user = { name: username };
        saveUser(this.user);
      } else {
        alert('Invalid credentials');
      }
    },

    logout() {
      this.user = null;
      saveUser(null);
      this.resetProjectForm();
      this.resetTaskForm();
    },

    editProject(project) {
      this.projectForm = deepClone({ ...project });
    },

    resetProjectForm() {
      this.projectForm = blankProject();
    },

    saveProject() {
      if (!this.projectForm.name || !this.projectForm.owner || !this.projectForm.status) {
        alert('Fill out project name, owner, and status.');
        return;
      }
      const copy = deepClone(this.data);
      if (this.projectForm.id) {
        const idx = copy.projects.findIndex((p) => p.id === this.projectForm.id);
        if (idx >= 0) {
          copy.projects[idx] = {
            ...copy.projects[idx],
            ...this.projectForm
          };
        }
      } else {
        const newProject = { ...this.projectForm, id: generateId('proj'), tasks: [] };
        copy.projects.push(newProject);
      }
      this.data = copy;
      saveData(copy);
      this.resetProjectForm();
    },

    deleteProject(projectId) {
      const copy = deepClone(this.data);
      copy.projects = copy.projects.filter((project) => project.id !== projectId);
      this.data = copy;
      saveData(copy);
      if (this.projectForm.id === projectId) {
        this.resetProjectForm();
      }
    },

    editTask(projectId, task) {
      this.taskForm = deepClone({ ...task, projectId });
    },

    resetTaskForm() {
      this.taskForm = blankTask();
    },

    saveTask() {
      if (!this.taskForm.projectId || !this.taskForm.title) {
        alert('Select a project and title for the task.');
        return;
      }
      const copy = deepClone(this.data);
      const project = copy.projects.find((p) => p.id === this.taskForm.projectId);
      if (!project) {
        alert('Unknown project');
        return;
      }
      project.tasks = project.tasks ?? [];
      if (this.taskForm.id) {
        const idx = project.tasks.findIndex((task) => task.id === this.taskForm.id);
        if (idx >= 0) {
          project.tasks[idx] = {
            ...project.tasks[idx],
            ...this.taskForm
          };
        }
      } else {
        const newTask = { ...this.taskForm, id: generateId('task') };
        project.tasks.push(newTask);
      }
      this.data = copy;
      saveData(copy);
      this.resetTaskForm();
    },

    deleteTask(projectId, taskId) {
      const copy = deepClone(this.data);
      const project = copy.projects.find((p) => p.id === projectId);
      if (!project) return;
      project.tasks = (project.tasks ?? []).filter((task) => task.id !== taskId);
      this.data = copy;
      saveData(copy);
      if (this.taskForm.id === taskId) {
        this.resetTaskForm();
      }
    }
  });
});
