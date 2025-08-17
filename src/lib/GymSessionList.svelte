<script lang="ts">
  export let sessions: Array<{
    id: string;
    date: string;
    notes: string | null;
    createdAt: string;
    exercises?: Array<{
      exerciseName: string;
      sets: number;
      reps: number;
      weight: string | null;
      unit: string;
    }>;
  }> = [];
  
  export let loading = false;
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
</script>

<div class="sessions-list">
  <h2>Your Gym Sessions</h2>
  
  {#if loading}
    <div class="loading">Loading sessions...</div>
  {:else if sessions.length === 0}
    <div class="empty-state">
      <p>No gym sessions recorded yet.</p>
      <p>Start by adding your first session!</p>
    </div>
  {:else}
    <div class="sessions">
      {#each sessions as session}
        <div class="session-card">
          <div class="session-header">
            <h3>{formatDate(session.date)}</h3>
            <a href="/sessions/{session.id}" class="view-link">View Details</a>
          </div>
          
          {#if session.notes}
            <p class="session-notes">{session.notes}</p>
          {/if}
          
          {#if session.exercises && session.exercises.length > 0}
            <div class="exercise-summary">
              <strong>Exercises:</strong>
              <ul>
                {#each session.exercises.slice(0, 3) as exercise}
                  <li>
                    {exercise.exerciseName} - 
                    {exercise.sets} sets × {exercise.reps} reps
                    {#if exercise.weight}
                      @ {exercise.weight} {exercise.unit}
                    {/if}
                  </li>
                {/each}
                {#if session.exercises.length > 3}
                  <li class="more">...and {session.exercises.length - 3} more</li>
                {/if}
              </ul>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .sessions-list {
    background: var(--color-surface, #fff);
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  h2 {
    margin-bottom: 1.5rem;
    color: var(--color-text, #333);
  }
  
  h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--color-text, #333);
  }
  
  .loading,
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--color-text-secondary, #666);
  }
  
  .empty-state p {
    margin: 0.5rem 0;
  }
  
  .sessions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .session-card {
    background: var(--color-background, #f8f9fa);
    border: 1px solid var(--color-border, #ddd);
    border-radius: 4px;
    padding: 1.5rem;
    transition: box-shadow 0.2s;
  }
  
  .session-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .session-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .view-link {
    color: var(--color-primary, #007bff);
    text-decoration: none;
    font-weight: 500;
  }
  
  .view-link:hover {
    text-decoration: underline;
  }
  
  .session-notes {
    color: var(--color-text-secondary, #666);
    margin: 0.5rem 0;
    font-style: italic;
  }
  
  .exercise-summary {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border, #ddd);
  }
  
  .exercise-summary strong {
    color: var(--color-text, #333);
  }
  
  .exercise-summary ul {
    margin: 0.5rem 0 0 0;
    padding-left: 1.5rem;
  }
  
  .exercise-summary li {
    color: var(--color-text-secondary, #666);
    margin: 0.25rem 0;
  }
  
  .exercise-summary li.more {
    font-style: italic;
  }
</style>