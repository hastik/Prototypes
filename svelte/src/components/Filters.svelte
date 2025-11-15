<script lang="ts">
  import { actions, PRIORITY_OPTIONS, STATUS_OPTIONS, filtersStore } from '../stores';

  const { setFilters } = actions;
  let status = '';
  let priority = '';
  let search = '';

  $: ({ status, priority, search } = $filtersStore);

  const submit = () => {
    setFilters({ status, priority, search });
  };
</script>

<form class="form-grid form-grid--small" on:submit|preventDefault={submit}>
  <div class="form-group">
    <label>Status</label>
    <select bind:value={status}>
      <option value="">All</option>
      {#each STATUS_OPTIONS as option}
        <option value={option}>{option}</option>
      {/each}
    </select>
  </div>
  <div class="form-group">
    <label>Priority</label>
    <select bind:value={priority}>
      <option value="">All</option>
      {#each PRIORITY_OPTIONS as option}
        <option value={option}>{option}</option>
      {/each}
    </select>
  </div>
  <div class="form-group">
    <label>Search</label>
    <input bind:value={search} placeholder="Project or owner" />
  </div>
  <button type="submit">Apply</button>
</form>
