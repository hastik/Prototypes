<script lang="ts">
  import type { Project } from '../seed';
  import { actions } from '../stores';

  export let projects: Project[] = [];
  const { deleteProject, stageProject } = actions;
</script>

{#if projects.length === 0}
  <div class="list-empty"><p>No projects match the filters.</p></div>
{:else}
  {#each projects as project (project.id)}
    <article class="project-card">
      <header>
        <div>
          <h3>{project.name}</h3>
          <small>Owner: {project.owner}</small>
        </div>
        <span class="status-pill" data-state={project.status}>{project.status}</span>
      </header>
      <p>Progress: {project.progress}% · Timeline: {project.timeline ?? 'tbd'}</p>
      <p>Tasks: {project.tasks?.length ?? 0}</p>
      <div class="card-actions">
        <button class="btn btn--ghost" on:click={() => stageProject(project)}>Edit</button>
        <button class="btn btn--ghost" on:click={() => deleteProject(project.id)}>Delete</button>
      </div>
    </article>
  {/each}
{/if}
