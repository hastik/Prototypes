export type Status = 'backlog' | 'in-progress' | 'blocked' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  assignee: string;
  priority: Priority;
  status: Status;
  dueDate?: string;
}

export interface Project {
  id: string;
  name: string;
  owner: string;
  status: Status;
  progress: number;
  timeline?: string;
  tasks: Task[];
}

export interface AppData {
  projects: Project[];
  filters: {
    statuses: Status[];
    priorities: Priority[];
  };
}

export const seedData: AppData = {
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
