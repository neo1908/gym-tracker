<script lang="ts">
  import { signIn } from '$lib/auth-client';
  import { goto } from '$app/navigation';
  
  let email = '';
  let password = '';
  let error = '';
  let loading = false;
  
  async function handleLogin() {
    error = '';
    loading = true;
    
    try {
      const result = await signIn.email({
        email,
        password
      });
      
      if (result.error) {
        error = result.error.message || 'Login failed';
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

<div class="login-container">
  <h2>Login</h2>
  
  <form on:submit|preventDefault={handleLogin}>
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
        placeholder="Enter your password"
      />
    </div>
    
    {#if error}
      <div class="error-message">{error}</div>
    {/if}
    
    <button type="submit" disabled={loading}>
      {loading ? 'Logging in...' : 'Login'}
    </button>
  </form>
</div>

<style>
  .login-container {
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
</style>