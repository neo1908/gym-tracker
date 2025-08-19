<script lang="ts">
  import { onMount } from 'svelte';
  import GymSessionForm from '$lib/GymSessionForm.svelte';
  import GymSessionList from '$lib/GymSessionList.svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  let sessions: any[] = [];
  let exercises: string[] = [];
  let loading = true;
  let saving = false;
  let showForm = false;
  let error = '';
  
  onMount(async () => {
    if (!$page.data.user) {
      goto('/login');
      return;
    }
    
    await Promise.all([
      fetchSessions(),
      fetchExercises()
    ]);
  });
  
  async function fetchSessions() {
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        sessions = await response.json();
      } else if (response.status === 401) {
        goto('/login');
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      error = 'Failed to load sessions';
    } finally {
      loading = false;
    }
  }
  
  async function fetchExercises() {
    try {
      const response = await fetch('/api/exercise-list');
      if (response.ok) {
        const data = await response.json();
        exercises = data.exercises || [];
      }
    } catch (err) {
      console.error('Failed to fetch exercises:', err);
    }
  }
  
  async function handleSessionSubmit(event: CustomEvent) {
    saving = true;
    error = '';
    
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event.detail)
      });
      
      if (response.ok) {
        const newSession = await response.json();
        sessions = [newSession, ...sessions];
        showForm = false;
      } else if (response.status === 401) {
        goto('/login');
      } else {
        error = 'Failed to save session';
      }
    } catch (err) {
      console.error('Failed to save session:', err);
      error = 'An error occurred while saving';
    } finally {
      saving = false;
    }
  }
  
  function handleCancel() {
    showForm = false;
  }
</script>

<svelte:head>
  <title>Gym Sessions - Gym Tracker</title>
</svelte:head>

<div class="sessions-page">
  <div class="page-header">
    <h1>Gym Sessions</h1>
    {#if !showForm}
      <button on:click={() => showForm = true} class="add-button">
        Add Session
      </button>
    {/if}
  </div>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if showForm}
    <GymSessionForm
      {exercises}
      loading={saving}
      on:submit={handleSessionSubmit}
      on:cancel={handleCancel}
    />
  {:else}
    <GymSessionList {sessions} {loading} />
  {/if}
</div>

<style>
  .sessions-page {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  h1 {
    margin: 0;
    color: var(--color-text, #333);
  }
  
  .add-button {
    padding: 0.75rem 1.5rem;
    background: var(--color-primary, #007bff);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .add-button:hover {
    background: var(--color-primary-hover, #0056b3);
  }
  
  .error-message {
    background: #fee;
    color: #c00;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    text-align: center;
  }
</style>