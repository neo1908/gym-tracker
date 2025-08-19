<script lang="ts">
  import { signOut } from '$lib/auth-client';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  
  async function handleSignOut() {
    await signOut();
    goto('/login');
  }
  
  // Use server-side session data from page data
  $: session = $page.data.session;
  $: allowSignups = $page.data.allowSignups;
</script>

<div class="auth-status">
  {#if session && session.user}
    <div class="user-info">
      <span class="user-email">{session.user.email}</span>
      <button on:click={handleSignOut} class="logout-button">
        Logout
      </button>
    </div>
  {:else}
    <div class="auth-links">
      <a href="/login">Login</a>
      {#if allowSignups}
        <a href="/signup">Sign Up</a>
      {/if}
    </div>
  {/if}
</div>

<style>
  .auth-status {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .user-email {
    color: var(--color-text, #333);
    font-weight: 500;
  }
  
  .logout-button {
    padding: 0.5rem 1rem;
    background: var(--color-secondary, #6c757d);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background-color 0.2s;
  }
  
  .logout-button:hover {
    background: var(--color-secondary-hover, #5a6268);
  }
  
  .auth-links {
    display: flex;
    gap: 1rem;
  }
  
  .auth-links a {
    padding: 0.5rem 1rem;
    background: var(--color-primary, #007bff);
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-size: 0.875rem;
    transition: background-color 0.2s;
  }
  
  .auth-links a:hover {
    background: var(--color-primary-hover, #0056b3);
  }
</style>