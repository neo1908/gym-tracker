<script lang="ts">
	import { onMount } from 'svelte';
	import { exercises, filteredExercises, theme } from '$lib/store';
	import LazyChart from '$lib/LazyChart.svelte';
	import ExerciseError from '$lib/ExerciseError.svelte';
	import WorkoutSummary from '$lib/WorkoutSummary.svelte';
	import ConsistencyCalendar from '$lib/ConsistencyCalendar.svelte';
	import type { Exercise, ExercisesResponse, ErrorResponse } from '$lib/types';
	
	let loading = true;
	let error: string | null = null;
	let selectedExercises = new Set<string>();
	let showAllExercises = true;
	let exerciseMenuCollapsed = true;
	let startDate: string = '';
	let endDate: string = '';
	let searchTerm: string = '';

	onMount(async () => {
		await loadExerciseData();
	});
	
	async function loadExerciseData(): Promise<void> {
		try {
			loading = true;
			error = null;
			const response = await fetch('/api/exercises');
			const data: ExercisesResponse | ErrorResponse = await response.json();
			
			if ('error' in data) {
				error = data.error;
			} else {
				exercises.set(data.exercises);
				filteredExercises.set(data.exercises);
				// Select all exercises by default
				selectedExercises = new Set(Object.keys($exercises));
			}
		} catch (err) {
			error = (err as Error).message;
		} finally {
			loading = false;
		}
	}
	
	function toggleExercise(exerciseName: string): void {
		if (selectedExercises.has(exerciseName)) {
			selectedExercises.delete(exerciseName);
		} else {
			selectedExercises.add(exerciseName);
		}
		selectedExercises = selectedExercises;
	}
	
	function toggleAll(): void {
		if (showAllExercises) {
			selectedExercises = new Set();
		} else {
			selectedExercises = new Set(Object.keys($filteredExercises));
		}
		showAllExercises = !showAllExercises;
	}
	
	function toggleExerciseMenu(): void {
		exerciseMenuCollapsed = !exerciseMenuCollapsed;
	}

	function applyFilters() {
		let tempExercises = { ...$exercises };

		if (startDate && endDate) {
			for (const exerciseName in tempExercises) {
				const exercise = tempExercises[exerciseName];
				exercise.sessions = exercise.sessions.filter(session => {
					const sessionDate = new Date(session.date);
					return sessionDate >= new Date(startDate) && sessionDate <= new Date(endDate);
				});
			}
		}

		if (searchTerm) {
			const lowerCaseSearchTerm = searchTerm.toLowerCase();
			const filtered: Record<string, Exercise> = {};
			for (const exerciseName in tempExercises) {
				if (exerciseName.toLowerCase().includes(lowerCaseSearchTerm)) {
					filtered[exerciseName] = tempExercises[exerciseName];
				}
			}
			tempExercises = filtered;
		}

		filteredExercises.set(tempExercises);
	}
</script>

<svelte:head>
	<title>Gym Tracker</title>
</svelte:head>

<main>
	<h1>Gym Progress Tracker</h1>
	
	{#if loading}
		<div class="loading" role="status" aria-live="polite">
			<p>Loading your workout data...</p>
		</div>
	{:else if error}
		<div class="error" role="alert" aria-live="assertive">
			<p><strong>Error:</strong> {error}</p>
			<p>Make sure your Google Sheet is shared with the service account email.</p>
			<button on:click={loadExerciseData}>Retry</button>
		</div>
	{:else if Object.keys($exercises).length === 0}
		<div class="empty-state" role="status" aria-live="polite">
			<p>No exercise data found in the "LPP" sheet.</p>
			<button on:click={loadExerciseData}>Reload Data</button>
		</div>
	{:else}
		<div class="dashboard">
			<WorkoutSummary exercises={$exercises} />
			<ConsistencyCalendar exercises={$exercises} />
		</div>
		<div class="controls">
			<div 
				class="controls-header" 
				on:click={toggleExerciseMenu} 
				on:keydown={(e) => e.key === 'Enter' && toggleExerciseMenu()}
				role="button"
				tabindex="0"
				aria-expanded={!exerciseMenuCollapsed}
				aria-controls="exercise-controls"
			>
				<h2>Exercises</h2>
				<button class="collapse-toggle" class:collapsed={exerciseMenuCollapsed} aria-label="Toggle exercise menu">
					{exerciseMenuCollapsed ? '▼' : '▲'}
				</button>
			</div>
			
			{#if !exerciseMenuCollapsed}
				<div id="exercise-controls" class="control-buttons">
					<input type="text" placeholder="Search exercises..." bind:value={searchTerm} on:input={applyFilters} aria-label="Search exercises" />
					<input type="date" bind:value={startDate} aria-label="Start date" />
					<input type="date" bind:value={endDate} aria-label="End date" />
					<button on:click={applyFilters}>Filter</button>
					<button on:click={toggleAll}>
						{showAllExercises ? 'Deselect All' : 'Select All'}
					</button>
					<button on:click={loadExerciseData} class="refresh-button">
						Refresh Data
					</button>
				</div>
				
				<div class="exercise-list">
					{#each Object.entries($filteredExercises) as [name, exercise]}
						<label class:has-errors={exercise.parseErrors && exercise.parseErrors.length > 0}>
							<input 
								type="checkbox" 
								checked={selectedExercises.has(name)}
								on:change={() => toggleExercise(name)}
							/>
							<span>
								<strong>{name}</strong>
								{#if exercise.parseErrors && exercise.parseErrors.length > 0}
									<small class="error-info">
										({exercise.sessions.length} sessions, {exercise.parseErrors.length} parse error{exercise.parseErrors.length > 1 ? 's' : ''})
									</small>
								{:else}
									<small>({exercise.sessions.length} sessions)</small>
								{/if}
							</span>
							{#if exercise.parseErrors && exercise.parseErrors.length > 0}
								<span class="error-indicator">❌</span>
							{/if}
						</label>
					{/each}
				</div>
			{/if}
		</div>
		
		<div class="charts">
			{#each Object.entries($filteredExercises) as [name, exercise]}
				{#if selectedExercises.has(name)}
					{#if exercise.parseErrors && exercise.parseErrors.length > 0}
						<ExerciseError {exercise} />
					{:else if exercise.sessions.length > 0}
						<LazyChart {exercise} />
					{/if}
				{/if}
			{/each}
		</div>
	{/if}
</main>

<style>
	main {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
	}
	
	h1 {
		text-align: center;
		margin-bottom: 3rem;
		font-size: 3rem;
		font-weight: 800;
	}

	.dashboard {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}
	
	.error {
		background: rgba(239, 68, 68, 0.1);
		color: #fca5a5;
		padding: 1rem;
		border-radius: var(--border-radius);
		border: 1px solid rgba(239, 68, 68, 0.2);
		margin-bottom: 1rem;
		font-weight: 500;
		backdrop-filter: blur(10px);
	}
	
	.controls {
		background: var(--background-card);
		border-radius: var(--border-radius);
		padding: 2rem;
		margin-bottom: 3rem;
		box-shadow: var(--shadow-lg), var(--shadow-glow);
		border: 1px solid var(--border-light);
		backdrop-filter: blur(20px);
	}
	
	.controls-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		cursor: pointer;
		margin-bottom: 1.5rem;
		transition: all 0.2s ease;
	}
	
	.controls-header:hover {
		color: var(--primary-color);
	}
	
	.controls h2 {
		margin: 0;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.controls h2::before {
		content: "🏋️";
		font-size: 1.25em;
	}
	
	.collapse-toggle {
		background: transparent;
		border: none;
		color: var(--text-secondary);
		font-size: 1rem;
		padding: 0.5rem;
		cursor: pointer;
		border-radius: var(--border-radius-sm);
		transition: all 0.3s ease;
		box-shadow: none;
		min-width: auto;
	}
	
	.collapse-toggle:hover {
		background: var(--background-elevated);
		color: var(--primary-color);
		transform: none;
		box-shadow: none;
	}
	
	.collapse-toggle.collapsed {
		transform: rotate(0deg);
	}
	
	.control-buttons {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}
	
	.refresh-button {
		background: linear-gradient(135deg, #10b981, #059669);
		color: white;
		border: none;
	}
	
	.refresh-button:hover {
		background: linear-gradient(135deg, #059669, #047857);
	}
	
	.exercise-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}
	
	.exercise-list label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		padding: 0.75rem 1rem;
		background: var(--background-elevated);
		border-radius: var(--border-radius-sm);
		border: 2px solid transparent;
		transition: all 0.3s ease;
		font-weight: 500;
		color: var(--text-secondary);
		backdrop-filter: blur(10px);
		position: relative;
	}
	
	.exercise-list label.has-errors {
		border-color: rgba(239, 68, 68, 0.3);
		background: rgba(239, 68, 68, 0.05);
	}
	
	.exercise-list label:hover {
		background: var(--background-input);
		border-color: var(--primary-color);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md), var(--shadow-glow);
		color: var(--text-primary);
	}
	
	.exercise-list span {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.exercise-list span strong {
		font-size: 0.95rem;
		line-height: 1.2;
	}
	
	.exercise-list span small {
		color: var(--text-muted);
		font-size: 0.8rem;
		font-weight: 400;
	}
	
	.exercise-list input[type="checkbox"]:checked + span strong {
		color: var(--primary-color);
	}
	
	.error-info {
		color: #fca5a5 !important;
		font-weight: 500;
	}
	
	.error-indicator {
		margin-left: auto;
		font-size: 1rem;
		opacity: 0.8;
	}
	
	.charts {
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}
	
	/* Loading and empty states */
	.loading, .empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: var(--background-card);
		border-radius: var(--border-radius);
		box-shadow: var(--shadow-lg), var(--shadow-glow);
		color: var(--text-secondary);
		border: 1px solid var(--border-light);
		backdrop-filter: blur(20px);
	}
	
	.loading::before {
		content: "⏳";
		font-size: 2rem;
		display: block;
		margin-bottom: 1rem;
	}
	
	.empty-state::before {
		content: "📊";
		font-size: 3rem;
		display: block;
		margin-bottom: 1rem;
	}
	
	/* Responsive design */
	@media (max-width: 768px) {
		main {
			padding: 1rem;
		}
		
		h1 {
			font-size: 2rem;
			margin-bottom: 2rem;
		}
		
		.dashboard {
			grid-template-columns: 1fr;
		}

		.controls {
			padding: 1.5rem;
			margin-bottom: 2rem;
		}
		
		.exercise-list {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}
		
		.control-buttons {
			flex-direction: column;
			gap: 0.75rem;
		}
		
		.charts {
			gap: 2rem;
		}
	}
	
	@media (max-width: 480px) {
		.exercise-list label {
			padding: 0.625rem 0.75rem;
			font-size: 0.875rem;
		}
	}
</style>
