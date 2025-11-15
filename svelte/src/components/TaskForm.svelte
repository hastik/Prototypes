<script lang="ts">
  import { PRIORITY_OPTIONS, STATUS_OPTIONS, actions, dataStore, editingProject, editingTask } from '../stores';
  const { saveProject, saveTask, stageProject, stageTask } = actions;

  const emptyProject = () => ({ id: '', name: '', owner: '', status: '', progress: 0, timeline: '' });
  const emptyTask = () => ({ id: '', projectId: '', title: '', assignee: '', priority: 'medium', status: 'backlog', dueDate: '' });

  let projectForm = emptyProject();
  let taskForm = emptyTask();
  $: allProjects = $dataStore.projects ?? [];

  $: if ($editingProject && $editingProject.id !== projectForm.id) {
    projectForm = { ...$editingProject };
  } else if (!$editingProject && projectForm.id) {
    projectForm = emptyProject();
  }

  $: if ($editingTask && $editingTask.task.id !== taskForm.id) {
    taskForm = { ...$editingTask.task, projectId: $editingTask.projectId };
  } else if (!$editingTask && taskForm.id) {
    taskForm = emptyTask();
  }

  const handleProject = () => {
    if (!projectForm.name || !projectForm.owner || !projectForm.status) {
      alert('Fill out all required project fields.');
      return;
    }
    saveProject({ ...projectForm, progress: Number(projectForm.progress) || 0 });
    projectForm = emptyProject();
  };

  const handleTask = () => {
    if (!taskForm.projectId || !taskForm.title) {
      alert('Select a project and title for the task.');
      return;
    }
    saveTask({ ...taskForm, projectId: taskForm.projectId });
    taskForm = emptyTask();
  };
</script>

<div class="form-grid">
  <section>
    <h3>{projectForm.id ? 'Edit project' : 'New project'}</h3>
    <form class="form-grid" on:submit|preventDefault={handleProject}>
      <div class="form-group">
        <label>Name</label>
        <input bind:value={projectForm.name} required />
      </div>
      <div class="form-group">
        <label>Owner</label>
        <input bind:value={projectForm.owner} required />
      </div>
      <div class="form-group">
        <label>Status</label>
        <select bind:value={projectForm.status} required>
          <option value="">Select</option>
          {#each STATUS_OPTIONS as status}
            <option value={status}>{status}</option>
          {/each}
        </select>
      </div>
      <div class="form-group">
        <label>Progress %</label>
        <input type="number" min="0" max="100" bind:value={projectForm.progress} />
      </div>
      <div class="form-group">
        <label>Timeline</label>
        <input bind:value={projectForm.timeline} />
      </div>
      <button type="submit">Save</button>
      {#if projectForm.id}
        <button type="button" on:click={() => { stageProject(null); projectForm = emptyProject(); }}>Cancel</button>
      {/if}
    </form>
  </section>

  <section>
    <h3>{taskForm.id ? 'Edit task' : 'New task'}</h3>
    <form class="form-grid" on:submit|preventDefault={handleTask}>
      <div class="form-group">
        <label>Project</label>
        <select bind:value={taskForm.projectId} required>
          <option value="">Select project</option>
          {#each allProjects as project}
            <option value={project.id}>{project.name}</option>
          {/each}
        </select>
      </div>
      <div class="form-group">
        <label>Title</label>
        <input bind:value={taskForm.title} required />
      </div>
      <div class="form-group">
        <label>Assignee</label>
        <input bind:value={taskForm.assignee} required />
      </div>
      <div class="form-group">
        <label>Priority</label>
        <select bind:value={taskForm.priority} required>
          {#each PRIORITY_OPTIONS as priority}
            <option value={priority}>{priority}</option>
          {/each}
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select bind:value={taskForm.status} required>
          {#each STATUS_OPTIONS as status}
            <option value={status}>{status}</option>
          {/each}
        </select>
      </div>
      <div class="form-group">
        <label>Due date</label>
        <input bind:value={taskForm.dueDate} placeholder="2025-12-01" />
      </div>
      <button type="submit">Save</button>
      {#if taskForm.id}
        <button type="button" on:click={() => { stageTask(null); taskForm = emptyTask(); }}>Cancel</button>
      {/if}
    </form>
  </section>
</div>
