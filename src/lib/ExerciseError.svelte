<script lang="ts">
	import type { Exercise } from '$lib/types';
	
	export let exercise: Exercise;
	
	function formatErrorLocations(parseErrors: string[]): string {
		if (!parseErrors || parseErrors.length === 0) return '';
		
		// Since we changed to ignore errors, this should now just be a simple count
		// But keeping the function for backward compatibility
		if (parseErrors.length === 1) {
			return `1 location`;
		} else {
			return `${parseErrors.length} locations`;
		}
	}
</script>

<div class="exercise-error">
	<div class="error-header">
		<h2>❌ {exercise.name}</h2>
		<span class="error-badge">Parse Error</span>
	</div>
	
	<div class="error-content">
		<div class="error-message">
			<p>
				<strong>Unable to display chart:</strong> 
				Found unparseable data in {formatErrorLocations(exercise.parseErrors)} of the LPP sheet.
			</p>
			
			{#if exercise.sessions && exercise.sessions.length > 0}
				<p class="partial-data-note">
					<em>Note: {exercise.sessions.length} session(s) with valid data were found, but the chart cannot be displayed due to parsing errors.</em>
				</p>
			{/if}
		</div>
		
		<div class="help-text">
			<p><strong>Expected format:</strong> "weight/reps" (e.g., "70kg/10", "15/8", "DB 20/12")</p>
			<p><strong>Additional sets:</strong> Add " SD" to mark same-day sets (e.g., "50/15 SD")</p>
		</div>
	</div>
</div>

<style>
	.exercise-error {
		background: var(--background-card);
		border-radius: var(--border-radius);
		padding: 2rem;
		box-shadow: var(--shadow-lg), var(--shadow-glow);
		border: 1px solid rgba(239, 68, 68, 0.3);
		margin-bottom: 2rem;
		backdrop-filter: blur(20px);
		position: relative;
		overflow: hidden;
	}
	
	.exercise-error::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, #ef4444, #dc2626, #b91c1c);
	}
	
	.error-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}
	
	.error-header h2 {
		margin: 0;
		color: var(--text-primary);
		font-size: 1.5rem;
		font-weight: 700;
	}
	
	.error-badge {
		background: rgba(239, 68, 68, 0.2);
		color: #fca5a5;
		padding: 0.5rem 1rem;
		border-radius: var(--border-radius-sm);
		font-size: 0.875rem;
		font-weight: 600;
		border: 1px solid rgba(239, 68, 68, 0.3);
		backdrop-filter: blur(10px);
	}
	
	.error-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.error-message {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: var(--border-radius-sm);
		padding: 1.5rem;
		backdrop-filter: blur(10px);
	}
	
	.error-message p {
		margin: 0 0 1rem 0;
		color: #fca5a5;
		font-weight: 500;
		line-height: 1.5;
	}
	
	.error-message p:last-child {
		margin-bottom: 0;
	}
	
	.partial-data-note {
		color: #fbbf24 !important;
		font-size: 0.9rem;
	}
	
	.help-text {
		background: var(--background-elevated);
		border: 1px solid var(--border-light);
		border-radius: var(--border-radius-sm);
		padding: 1.5rem;
		backdrop-filter: blur(10px);
	}
	
	.help-text p {
		margin: 0 0 0.75rem 0;
		color: var(--text-secondary);
		font-size: 0.9rem;
		line-height: 1.4;
	}
	
	.help-text p:last-child {
		margin-bottom: 0;
	}
	
	.help-text strong {
		color: var(--text-primary);
		font-weight: 600;
	}
	
	/* Responsive design */
	@media (max-width: 768px) {
		.exercise-error {
			padding: 1.5rem;
		}
		
		.error-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}
		
		.error-header h2 {
			font-size: 1.25rem;
		}
		
		.error-content {
			gap: 1rem;
		}
		
		.error-message, .help-text {
			padding: 1rem;
		}
	}
</style>