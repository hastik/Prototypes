<script lang="ts">
  import Filters from './components/Filters.svelte';
  import Login from './components/Login.svelte';
  import ProjectList from './components/ProjectList.svelte';
  import TaskForm from './components/TaskForm.svelte';
  import TaskList from './components/TaskList.svelte';
  import { actions, filteredProjects, metricsStore, userStore } from './stores';

  const { logout } = actions;
  $: user = $userStore;
  $: projects = $filteredProjects;
  $: metrics = $metricsStore;
</script>

<div class="app-shell">
  <header class="app-header">
    <div class="brand">
      <div class="badge">Ops</div>
      <div class="brand-copy">
        <h1>Project Delivery Console</h1>
        <p>Insights, prioritisation, and task control</p>
      </div>
    </div>
    <div class="auth-slot" data-slot="auth">
      {#if user}
        <div class="auth-state">
          <span>Signed in as <strong>{user}</strong></span>
          <button on:click={logout}>Logout</button>
        </div>
      {:else}
        <span>Guest</span>
      {/if}
    </div>
  </header>

  <section class="app-hero">
    <div class="hero-copy">
      <h2>Workboard</h2>
      <p>Use the filters to focus, then manage projects and their tasks inline.</p>
    </div>
    <div class="hero-metrics" data-slot="metrics">
      {#each metrics as metric}
        <div class="metric-card">
          <p>{metric.label}</p>
          <h3>{metric.value}</h3>
        </div>
      {/each}
    </div>
  </section>

  <section class="panel panel--toolbar" data-slot="toolbar">
    <Filters />
  </section>

  <div class="panel-grid">
    <section class="panel panel--list" data-slot="projects">
      {#if user}
        <ProjectList {projects} />
      {:else}
        <div class="list-empty"><p>Sign in to view projects.</p></div>
      {/if}
    </section>

    <section class="panel panel--main" data-slot="tasks">
      {#if user}
        <TaskList {projects} />
      {:else}
        <div class="list-empty"><p>Sign in to manage tasks.</p></div>
      {/if}
    </section>

    <section class="panel panel--form" data-slot="forms">
      {#if user}
        <TaskForm />
      {:else}
        <Login />
      {/if}
    </section>
  </div>

  <footer class="app-footer">
    <small>Shared layout from /design/html/layout.html</small>
    <div class="footer-actions" data-slot="footer">
      <span>Svelte · LocalStorage stores</span>
    </div>
  </footer>
</div>
