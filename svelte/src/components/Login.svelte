<script lang="ts">
  import { actions } from '../stores';

  let username = 'admin';
  let password = '1234';
  const { login } = actions;

  const submit = () => login(username, password);
</script>

<form class="form-grid" on:submit|preventDefault={submit}>
  <h3>Sign in</h3>
  <div class="form-group">
    <label>Username</label>
    <input bind:value={username} />
  </div>
  <div class="form-group">
    <label>Password</label>
    <input type="password" bind:value={password} />
  </div>
  <button type="submit">Access console</button>
</form>
