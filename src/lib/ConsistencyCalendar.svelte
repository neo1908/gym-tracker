<script lang="ts">
  import type { Exercise } from "./types";

  export let exercises: Record<string, Exercise>;

  function getWorkoutDates() {
    const workoutDates = new Set<string>();
    for (const exerciseName in exercises) {
      const exercise = exercises[exerciseName];
      for (const session of exercise.sessions) {
        workoutDates.add(new Date(session.date).toDateString());
      }
    }
    return workoutDates;
  }

  const workoutDates = getWorkoutDates();

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDay = firstDayOfMonth.getDay();

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
</script>

<div class="consistency-calendar">
  <h2>Workout Consistency</h2>
  <div class="calendar">
    <div class="header">
      <div>Sun</div>
      <div>Mon</div>
      <div>Tue</div>
      <div>Wed</div>
      <div>Thu</div>
      <div>Fri</div>
      <div>Sat</div>
    </div>
    <div class="days">
      {#each Array(startingDay) as _}
        <div class="empty"></div>
      {/each}
      {#each calendarDays as day}
        <div
          class="day"
          class:active={workoutDates.has(
            new Date(year, month, day).toDateString()
          )}
        >
          {day}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .consistency-calendar {
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

  .calendar {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
  }

  .header {
    display: contents;
    font-weight: 600;
    text-align: center;
    color: var(--text-secondary);
  }

  .days {
    display: contents;
  }

  .day,
  .empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 2.5rem;
    border-radius: 50%;
  }

  .day.active {
    background-color: var(--primary-color);
    color: var(--text-primary);
  }
</style>
