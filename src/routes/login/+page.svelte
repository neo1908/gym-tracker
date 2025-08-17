<script lang="ts">
  import Login from '$lib/Login.svelte';
</script>

<svelte:head>
  <title>Login - Gym Tracker</title>
</svelte:head>

<div class="page-container">
  <Login />
  <p class="signup-link">
    Don't have an account? <a href="/signup">Sign up</a>
  </p>
</div>

<style>
  .page-container {
    min-height: calc(100vh - 200px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  
  .signup-link {
    text-align: center;
    margin-top: 1rem;
    color: var(--color-text-secondary, #666);
  }
  
  .signup-link a {
    color: var(--color-primary, #007bff);
    text-decoration: none;
  }
  
  .signup-link a:hover {
    text-decoration: underline;
  }
</style>