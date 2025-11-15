import { derived, get, writable } from 'svelte/store';
import type { AppData, Project, Task } from './seed';
import { seedData } from './seed';

const DATA_KEY = 'svelteAppData';
const USER_KEY = 'svelteAppUser';
const isBrowser = typeof window !== 'undefined';

const readStorage = <T>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.warn('Failed to read storage', error);
    return fallback;
  }
};

const persist = <T>(key: string, value: T) => {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

function createDataStore() {
  const start = readStorage<AppData>(DATA_KEY, seedData);
  const store = writable<AppData>(start);
  store.subscribe((value) => persist(DATA_KEY, value));
  return store;
}

function createUserStore() {
  const start = readStorage<string | null>(USER_KEY, null);
  const store = writable<string | null>(start);
  store.subscribe((value) => {
    if (!isBrowser) return;
    if (value) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(value));
    } else {
      window.localStorage.removeItem(USER_KEY);
    }
  });
  return store;
}

export const dataStore = createDataStore();
export const userStore = createUserStore();
export const filtersStore = writable({ status: '', priority: '', search: '' });
export const editingProject = writable<Project | null>(null);
export const editingTask = writable<{ projectId: string; task: Task } | null>(null);

export const filteredProjects = derived(
  [dataStore, filtersStore, userStore],
  ([$data, $filters, $user]) => {
    if (!$user) return [] as Project[];
    return ($data.projects ?? []).filter((project) => {
      if ($filters.status && project.status !== $filters.status) {
        return false;
      }
      if ($filters.search) {
        const hay = `${project.name} ${project.owner}`.toLowerCase();
        if (!hay.includes($filters.search.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }
);

export const metricsStore = derived([filteredProjects, filtersStore], ([$projects, $filters]) => {
  const totals = $projects.reduce(
    (acc, project) => {
      (project.tasks ?? []).forEach((task) => {
        if ($filters.priority && task.priority !== $filters.priority) {
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
    { label: 'Projects', value: $projects.length },
    { label: 'Tasks', value: totals.total },
    { label: 'Blocked', value: totals.blocked },
    { label: 'Completion', value: completion }
  ];
});

export const priorityFilter = derived(filtersStore, ($filters) => $filters.priority);

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const ensureProjectTasks = (project: Project) => {
  project.tasks = project.tasks ?? [];
  return project;
};

const persistDataUpdate = (updater: (data: AppData) => AppData) => {
  dataStore.update((current) => {
    const updated = updater(clone(current));
    return updated;
  });
};

export const actions = {
  login(username: string, password: string) {
    if (username === 'admin' && password === '1234') {
      userStore.set(username);
    } else {
      alert('Invalid credentials');
    }
  },
  logout() {
    userStore.set(null);
    editingProject.set(null);
    editingTask.set(null);
  },
  setFilters(filters: { status: string; priority: string; search: string }) {
    filtersStore.set(filters);
  },
  saveProject(project: Omit<Project, 'tasks'> & { id?: string }) {
    persistDataUpdate((data) => {
      if (project.id) {
        data.projects = data.projects.map((existing) =>
          existing.id === project.id ? { ...existing, ...project, tasks: existing.tasks } : existing
        );
      } else {
        data.projects.push({ ...project, id: generateId('proj'), tasks: [] });
      }
      return data;
    });
    editingProject.set(null);
  },
  deleteProject(projectId: string) {
    persistDataUpdate((data) => {
      data.projects = data.projects.filter((project) => project.id !== projectId);
      return data;
    });
    if (get(editingProject)?.id === projectId) {
      editingProject.set(null);
    }
  },
  saveTask(taskPayload: { projectId: string; id?: string } & Omit<Task, 'id'>) {
    persistDataUpdate((data) => {
      const project = data.projects.find((p) => p.id === taskPayload.projectId);
      if (!project) {
        return data;
      }
      ensureProjectTasks(project);
      if (taskPayload.id) {
        project.tasks = project.tasks.map((task) =>
          task.id === taskPayload.id ? { ...task, ...taskPayload } : task
        );
      } else {
        project.tasks.push({ ...taskPayload, id: generateId('task') });
      }
      return data;
    });
    editingTask.set(null);
  },
  deleteTask(projectId: string, taskId: string) {
    persistDataUpdate((data) => {
      const project = data.projects.find((p) => p.id === projectId);
      if (!project) return data;
      ensureProjectTasks(project);
      project.tasks = project.tasks.filter((task) => task.id !== taskId);
      return data;
    });
    const current = get(editingTask);
    if (current && current.projectId === projectId && current.task.id === taskId) {
      editingTask.set(null);
    }
  },
  stageProject(project: Project | null) {
    editingProject.set(project ? clone(project) : null);
  },
  stageTask(payload: { projectId: string; task: Task } | null) {
    editingTask.set(payload ? { projectId: payload.projectId, task: clone(payload.task) } : null);
  }
};

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}`;
}

export const STATUS_OPTIONS = seedData.filters.statuses;
export const PRIORITY_OPTIONS = seedData.filters.priorities;
