<script>
	import { onMount } from 'svelte';
	import ExerciseChart from './ExerciseChart.svelte';
	
	export let exercise;
	
	let chartContainer;
	let isVisible = false;
	let hasLoaded = false;
	let observer;
	
	onMount(() => {
		// Create intersection observer
		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						if (!hasLoaded) {
							// Add a small delay for staggered loading effect
							setTimeout(() => {
								isVisible = true;
								hasLoaded = true;
							}, Math.random() * 200 + 100);
						} else {
							// Show chart immediately if already loaded
							isVisible = true;
						}
					} else if (!entry.isIntersecting && hasLoaded) {
						// Hide chart when it goes out of view
						isVisible = false;
					}
				});
			},
			{
				rootMargin: '100px', // Start loading when chart is 100px away from viewport
				threshold: 0.1
			}
		);
		
		if (chartContainer) {
			observer.observe(chartContainer);
		}
		
		return () => {
			if (observer) {
				observer.disconnect();
			}
		};
	});
</script>

<div 
	bind:this={chartContainer} 
	class="lazy-chart-container"
	class:visible={isVisible}
	class:loading={!isVisible && !hasLoaded}
>
	{#if isVisible}
		<div class="chart-fade-in">
			<ExerciseChart {exercise} />
		</div>
	{:else}
		<div class="chart-skeleton">
			<div class="skeleton-header">
				<div class="skeleton-title"></div>
				<div class="skeleton-controls">
					<div class="skeleton-control"></div>
					<div class="skeleton-control"></div>
					<div class="skeleton-control"></div>
				</div>
			</div>
			<div class="skeleton-chart">
				<div class="skeleton-grid">
					{#each Array(4) as _, i}
						<div class="skeleton-line" style="animation-delay: {i * 0.2}s"></div>
					{/each}
				</div>
				<div class="skeleton-loading-text">
					📊 Loading {exercise.name} chart...
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.lazy-chart-container {
		opacity: 0;
		transform: translateY(30px);
		transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
	}
	
	.lazy-chart-container.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.chart-fade-in {
		animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}
	
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	
	.chart-skeleton {
		background: var(--background-card);
		border-radius: var(--border-radius);
		padding: 1.5rem;
		box-shadow: var(--shadow-lg);
		border: 1px solid var(--border-light);
		margin-bottom: 2rem;
		backdrop-filter: blur(20px);
	}
	
	.skeleton-header {
		margin-bottom: 1.5rem;
	}
	
	.skeleton-title {
		width: 200px;
		height: 24px;
		background: linear-gradient(90deg, var(--background-elevated) 25%, var(--background-input) 50%, var(--background-elevated) 75%);
		background-size: 200% 100%;
		animation: shimmer 2s infinite;
		border-radius: 8px;
		margin-bottom: 1rem;
	}
	
	.skeleton-controls {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	
	.skeleton-control {
		width: 120px;
		height: 36px;
		background: linear-gradient(90deg, var(--background-elevated) 25%, var(--background-input) 50%, var(--background-elevated) 75%);
		background-size: 200% 100%;
		animation: shimmer 2s infinite;
		border-radius: var(--border-radius-sm);
	}
	
	.skeleton-chart {
		position: relative;
		height: 450px;
		background: var(--background-elevated);
		border-radius: var(--border-radius-sm);
		border: 1px solid var(--border-light);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
	
	.skeleton-grid {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		opacity: 0.3;
	}
	
	.skeleton-line {
		position: absolute;
		height: 2px;
		background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
		animation: pulse 3s infinite;
	}
	
	.skeleton-line:nth-child(1) { top: 20%; width: 80%; left: 10%; }
	.skeleton-line:nth-child(2) { top: 40%; width: 60%; left: 20%; }
	.skeleton-line:nth-child(3) { top: 60%; width: 70%; left: 15%; }
	.skeleton-line:nth-child(4) { top: 80%; width: 50%; left: 25%; }
	
	.skeleton-loading-text {
		color: var(--text-muted);
		font-size: 1.1rem;
		font-weight: 500;
		z-index: 1;
		padding: 1rem;
		background: var(--background-card);
		border-radius: var(--border-radius-sm);
		backdrop-filter: blur(10px);
		animation: bounce 2s infinite;
	}
	
	@keyframes shimmer {
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }
	}
	
	@keyframes pulse {
		0%, 100% { opacity: 0.2; transform: scaleX(0); }
		50% { opacity: 0.8; transform: scaleX(1); }
	}
	
	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
		40% { transform: translateY(-5px); }
		60% { transform: translateY(-3px); }
	}
	
	/* Responsive adjustments */
	@media (max-width: 768px) {
		.skeleton-chart {
			height: 350px;
		}
		
		.skeleton-controls {
			flex-direction: column;
		}
		
		.skeleton-control {
			width: 100%;
		}
	}
</style>