<script lang="ts">
  import type { Exercise } from "./types";

  export let exercises: Record<string, Exercise>;

  function getLastWorkout() {
    let lastWorkout: { exercise: string; sets: number; reps: number; volume: number; }[] = [];
    let lastSessionNumber = 0;

    for (const exerciseName in exercises) {
      const exercise = exercises[exerciseName];
      if (exercise.sessions.length > 0) {
        const lastSession = exercise.sessions[exercise.sessions.length - 1];
        if (lastSession.sessionNumber > lastSessionNumber) {
          lastSessionNumber = lastSession.sessionNumber;
          lastWorkout = [];
        }
        if (lastSession.sessionNumber === lastSessionNumber) {
          lastWorkout.push({
            exercise: exercise.name,
            sets: lastSession.sets.length,
            reps: lastSession.reps,
            volume: lastSession.weight * lastSession.reps,
          });
        }
      }
    }

    return lastWorkout;
  }

  const lastWorkout = getLastWorkout();
</script>

<div class="workout-summary">
  <h2>Last Workout Summary</h2>
  {#if lastWorkout.length > 0}
    <table>
      <thead>
        <tr>
          <th>Exercise</th>
          <th>Sets</th>
          <th>Reps</th>
          <th>Volume</th>
        </tr>
      </thead>
      <tbody>
        {#each lastWorkout as workout}
          <tr>
            <td>{workout.exercise}</td>
            <td>{workout.sets}</td>
            <td>{workout.reps}</td>
            <td>{workout.volume.toFixed(1)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p>No workout data found.</p>
  {/if}
</div>

<style>
  .workout-summary {
    background: var(--background-card);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    box-shadow: var(--shadow-lg), var(--shadow-glow);
    border: 1px solid var(--border-light);
    margin-bottom: 2rem;
    backdrop-filter: blur(20px);
  }

  h2 {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--border-light);
  }

  th {
    font-weight: 600;
    color: var(--text-primary);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
</style>
