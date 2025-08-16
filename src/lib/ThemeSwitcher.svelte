<script lang="ts">
  import { onMount } from 'svelte';
  import { theme } from '$lib/store';

  onMount(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      $theme = savedTheme;
    } else {
      $theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', $theme);
  });

  function toggleTheme() {
    $theme = $theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', $theme);
    document.documentElement.setAttribute('data-theme', $theme);
  }
</script>

<button on:click={toggleTheme} class="theme-switcher">
  {$theme === 'light' ? '🌙' : '☀️'}
</button>

<style>
  .theme-switcher {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 999;
    background: var(--background-card);
    color: var(--text-secondary);
    border: 1px solid var(--border-medium);
    border-radius: 50%;
    width: 3rem;
    height: 3rem;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .theme-switcher:hover {
    background: var(--background-elevated);
    color: var(--text-primary);
    transform: scale(1.1);
  }
</style>
