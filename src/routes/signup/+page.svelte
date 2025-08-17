<script lang="ts">
  import SignUp from '$lib/SignUp.svelte';
</script>

<svelte:head>
  <title>Sign Up - Gym Tracker</title>
</svelte:head>

<div class="page-container">
  <SignUp />
  <p class="login-link">
    Already have an account? <a href="/login">Login</a>
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
  
  .login-link {
    text-align: center;
    margin-top: 1rem;
    color: var(--color-text-secondary, #666);
  }
  
  .login-link a {
    color: var(--color-primary, #007bff);
    text-decoration: none;
  }
  
  .login-link a:hover {
    text-decoration: underline;
  }
</style>