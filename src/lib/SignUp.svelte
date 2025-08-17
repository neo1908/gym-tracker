<script lang="ts">
  import { signUp } from '$lib/auth-client';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
  let email = '';
  let password = '';
  let confirmPassword = '';
  let name = '';
  let error = '';
  let loading = false;
  let signupsAllowed = false;
  
  onMount(async () => {
    const allowSignups = $page.data?.allowSignups;
    signupsAllowed = allowSignups === true;
  });
  
  async function handleSignUp() {
    error = '';
    
    if (!signupsAllowed) {
      error = 'Sign-ups are currently disabled';
      return;
    }
    
    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }
    
    if (password.length < 8) {
      error = 'Password must be at least 8 characters';
      return;
    }
    
    loading = true;
    
    try {
      const result = await signUp.email({
        email,
        password,
        name: name || undefined
      });
      
      if (result.error) {
        error = result.error.message || 'Sign-up failed';
      } else {
        goto('/');
      }
    } catch (err) {
      error = 'An unexpected error occurred';
      console.error(err);
    } finally {
      loading = false;
    }
  }
</script>

<div class="signup-container">
  <h2>Sign Up</h2>
  
  {#if !signupsAllowed}
    <div class="warning-message">
      Sign-ups are currently disabled. Please contact an administrator.
    </div>
  {:else}
    <form on:submit|preventDefault={handleSignUp}>
      <div class="form-group">
        <label for="name">Name (optional)</label>
        <input
          type="text"
          id="name"
          bind:value={name}
          disabled={loading}
          placeholder="Your name"
        />
      </div>
      
      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          required
          disabled={loading}
          placeholder="your@email.com"
        />
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          required
          disabled={loading}
          placeholder="At least 8 characters"
        />
      </div>
      
      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          bind:value={confirmPassword}
          required
          disabled={loading}
          placeholder="Re-enter your password"
        />
      </div>
      
      {#if error}
        <div class="error-message">{error}</div>
      {/if}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  {/if}
</div>

<style>
  .signup-container {
    max-width: 400px;
    margin: 2rem auto;
    padding: 2rem;
    background: var(--color-surface, #ffffff);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  h2 {
    margin-bottom: 1.5rem;
    text-align: center;
    color: var(--color-text, #333);
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--color-text, #333);
  }
  
  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 4px;
    font-size: 1rem;
    background: var(--color-input-bg, #fff);
    color: var(--color-text, #333);
  }
  
  input:focus {
    outline: none;
    border-color: var(--color-primary, #007bff);
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
  
  input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  button {
    width: 100%;
    padding: 0.75rem;
    background: var(--color-primary, #007bff);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  button:hover:not(:disabled) {
    background: var(--color-primary-hover, #0056b3);
  }
  
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .error-message {
    background: #fee;
    color: #c00;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    text-align: center;
  }
  
  .warning-message {
    background: #fff3cd;
    color: #856404;
    padding: 1rem;
    border-radius: 4px;
    text-align: center;
    border: 1px solid #ffeaa7;
  }
</style>