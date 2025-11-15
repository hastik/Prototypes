<script lang="ts">
  import type { Project, Task } from '../seed';
  import { actions, priorityFilter } from '../stores';

  export let projects: Project[] = [];
  const { deleteTask, stageTask } = actions;

  $: priority = $priorityFilter;

  const visibleTasks = (project: Project): Task[] => {
    if (!project.tasks) return [];
    return project.tasks.filter((task) => !priority || task.priority === priority);
  };
</script>

{#if projects.length === 0}
  <div class="list-empty"><p>No projects available.</p></div>
{:else}
  {#each projects as project (project.id)}
    <div>
      <h3>{project.name}</h3>
      {#if visibleTasks(project).length === 0}
        <div class="list-empty"><p>No tasks for this filter.</p></div>
      {:else}
        {#each visibleTasks(project) as task (task.id)}
          <article class="task-card">
            <header>
              <strong>{task.title}</strong>
              <span class="status-pill" data-state={task.status}>{task.status}</span>
            </header>
            <p>Assignee: {task.assignee} · Priority: {task.priority}</p>
            <p>Due: {task.dueDate ?? 'tbd'}</p>
            <div class="card-actions">
              <button class="btn btn--ghost" on:click={() => stageTask({ projectId: project.id, task })}>Edit</button>
              <button class="btn btn--ghost" on:click={() => deleteTask(project.id, task.id)}>Delete</button>
            </div>
          </article>
        {/each}
      {/if}
    </div>
  {/each}
{/if}
