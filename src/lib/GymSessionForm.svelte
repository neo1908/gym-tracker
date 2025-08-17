<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let exercises: string[] = [];
  export let loading = false;
  
  const dispatch = createEventDispatcher();
  
  let date = new Date().toISOString().split('T')[0];
  let notes = '';
  let exerciseLogs: Array<{
    name: string;
    sets: number;
    reps: number;
    weight: number | null;
    unit: string;
    notes: string;
  }> = [];
  
  function addExercise() {
    exerciseLogs = [...exerciseLogs, {
      name: exercises[0] || '',
      sets: 3,
      reps: 10,
      weight: null,
      unit: 'kg',
      notes: ''
    }];
  }
  
  function removeExercise(index: number) {
    exerciseLogs = exerciseLogs.filter((_, i) => i !== index);
  }
  
  function handleSubmit() {
    const sessionData = {
      date,
      notes,
      exercises: exerciseLogs.map(log => ({
        name: log.name,
        sets: log.sets,
        reps: log.reps,
        weight: log.weight,
        unit: log.unit,
        notes: log.notes
      }))
    };
    
    dispatch('submit', sessionData);
  }
  
  function handleCancel() {
    dispatch('cancel');
  }
</script>

<div class="session-form">
  <h2>New Gym Session</h2>
  
  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-group">
      <label for="date">Date</label>
      <input
        type="date"
        id="date"
        bind:value={date}
        required
        disabled={loading}
      />
    </div>
    
    <div class="form-group">
      <label for="notes">Session Notes (optional)</label>
      <textarea
        id="notes"
        bind:value={notes}
        disabled={loading}
        placeholder="How did the session go?"
        rows="3"
      />
    </div>
    
    <div class="exercises-section">
      <div class="section-header">
        <h3>Exercises</h3>
        <button type="button" on:click={addExercise} disabled={loading}>
          Add Exercise
        </button>
      </div>
      
      {#each exerciseLogs as exercise, index}
        <div class="exercise-card">
          <div class="exercise-header">
            <select bind:value={exercise.name} disabled={loading} required>
              <option value="">Select exercise</option>
              {#each exercises as ex}
                <option value={ex}>{ex}</option>
              {/each}
            </select>
            <button
              type="button"
              class="remove-btn"
              on:click={() => removeExercise(index)}
              disabled={loading}
            >
              Remove
            </button>
          </div>
          
          <div class="exercise-details">
            <div class="detail-group">
              <label>Sets</label>
              <input
                type="number"
                bind:value={exercise.sets}
                min="1"
                required
                disabled={loading}
              />
            </div>
            
            <div class="detail-group">
              <label>Reps</label>
              <input
                type="number"
                bind:value={exercise.reps}
                min="1"
                required
                disabled={loading}
              />
            </div>
            
            <div class="detail-group">
              <label>Weight</label>
              <input
                type="number"
                bind:value={exercise.weight}
                step="0.5"
                min="0"
                disabled={loading}
              />
            </div>
            
            <div class="detail-group">
              <label>Unit</label>
              <select bind:value={exercise.unit} disabled={loading}>
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
          </div>
          
          <div class="exercise-notes">
            <label>Notes</label>
            <input
              type="text"
              bind:value={exercise.notes}
              placeholder="Optional notes"
              disabled={loading}
            />
          </div>
        </div>
      {/each}
      
      {#if exerciseLogs.length === 0}
        <p class="no-exercises">No exercises added yet. Click "Add Exercise" to start.</p>
      {/if}
    </div>
    
    <div class="form-actions">
      <button type="button" on:click={handleCancel} disabled={loading}>
        Cancel
      </button>
      <button type="submit" class="primary" disabled={loading || exerciseLogs.length === 0}>
        {loading ? 'Saving...' : 'Save Session'}
      </button>
    </div>
  </form>
</div>

<style>
  .session-form {
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
    color: var(--color-text, #333);
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--color-text, #333);
  }
  
  input[type="date"],
  input[type="number"],
  input[type="text"],
  textarea,
  select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 4px;
    font-size: 1rem;
    background: var(--color-input-bg, #fff);
    color: var(--color-text, #333);
  }
  
  textarea {
    resize: vertical;
  }
  
  .exercises-section {
    margin-bottom: 2rem;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .exercise-card {
    background: var(--color-background, #f8f9fa);
    border: 1px solid var(--color-border, #ddd);
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .exercise-header {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .exercise-header select {
    flex: 1;
  }
  
  .remove-btn {
    padding: 0.5rem 1rem;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .remove-btn:hover:not(:disabled) {
    background: #c82333;
  }
  
  .exercise-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .detail-group {
    display: flex;
    flex-direction: column;
  }
  
  .detail-group label {
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }
  
  .exercise-notes {
    margin-top: 1rem;
  }
  
  .exercise-notes input {
    margin-top: 0.25rem;
  }
  
  .no-exercises {
    text-align: center;
    color: var(--color-text-secondary, #666);
    padding: 2rem;
    background: var(--color-background, #f8f9fa);
    border-radius: 4px;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }
  
  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  button.primary {
    background: var(--color-primary, #007bff);
    color: white;
  }
  
  button.primary:hover:not(:disabled) {
    background: var(--color-primary-hover, #0056b3);
  }
  
  button:not(.primary) {
    background: var(--color-secondary, #6c757d);
    color: white;
  }
  
  button:not(.primary):hover:not(:disabled) {
    background: var(--color-secondary-hover, #5a6268);
  }
</style>