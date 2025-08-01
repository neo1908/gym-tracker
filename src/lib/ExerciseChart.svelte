<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import type { Exercise, ChartViewMode } from '$lib/types';
	
	export let exercise: Exercise;
	
	let canvas: HTMLCanvasElement;
	let chart: Chart | undefined;
	let chartType: ChartViewMode = 'volume';
	
	function createChart(): void {
		if (chart) {
			chart.destroy();
		}
		
		const ctx = canvas.getContext('2d');
		
		// Sort sessions by session number or date
		const sortedSessions = [...exercise.sessions].sort((a, b) => {
			if (a.sessionNumber && b.sessionNumber) {
				return a.sessionNumber - b.sessionNumber;
			}
			return new Date(a.date) - new Date(b.date);
		});
		
		const labels = sortedSessions.map((s, index) => 
			s.sessionNumber ? `Session ${s.sessionNumber}` : s.date || `Workout ${index + 1}`
		);
		
		let datasets = [];
		let scales = {};
		
		switch (chartType) {
			case 'volume':
				// Best set volume (weight × reps)
				datasets = [{
					label: 'Best Set Volume (kg × reps)',
					data: sortedSessions.map(s => s.weight * s.reps),
					borderColor: '#60a5fa',
					backgroundColor: 'rgba(96, 165, 250, 0.2)',
					fill: true,
					tension: 0.1,
					borderWidth: 3,
					pointBackgroundColor: '#60a5fa',
					pointBorderColor: '#1e293b',
					pointBorderWidth: 2,
					pointRadius: 6,
					pointHoverRadius: 8
				}];
				scales = {
					y: {
						title: {
							display: true,
							text: 'Best Set Volume (kg × reps)',
							color: '#cbd5e1'
						},
						beginAtZero: true,
						grid: {
							color: 'rgba(203, 213, 225, 0.1)'
						},
						ticks: {
							color: '#94a3b8'
						}
					},
					x: {
						grid: {
							color: 'rgba(203, 213, 225, 0.1)'
						},
						ticks: {
							color: '#94a3b8'
						}
					}
				};
				break;
				
			case 'total-volume':
				// Total session volume (sum of all sets)
				datasets = [{
					label: 'Total Session Volume (kg × reps)',
					data: sortedSessions.map(s => {
						if (s.sets && s.sets.length > 0) {
							return s.sets.reduce((total, set) => total + (set.weight * set.reps), 0);
						}
						return s.weight * s.reps;
					}),
					borderColor: '#f472b6',
					backgroundColor: 'rgba(244, 114, 182, 0.2)',
					fill: true,
					tension: 0.1,
					borderWidth: 3,
					pointBackgroundColor: '#f472b6',
					pointBorderColor: '#1e293b',
					pointBorderWidth: 2,
					pointRadius: 6,
					pointHoverRadius: 8
				}];
				scales = {
					y: {
						title: {
							display: true,
							text: 'Total Session Volume (kg × reps)',
							color: '#cbd5e1'
						},
						beginAtZero: true,
						grid: {
							color: 'rgba(203, 213, 225, 0.1)'
						},
						ticks: {
							color: '#94a3b8'
						}
					},
					x: {
						grid: {
							color: 'rgba(203, 213, 225, 0.1)'
						},
						ticks: {
							color: '#94a3b8'
						}
					}
				};
				break;
				
			case 'weight':
				datasets = [{
					label: 'Weight (kg)',
					data: sortedSessions.map(s => s.weight),
					borderColor: '#ef4444',
					backgroundColor: 'rgba(239, 68, 68, 0.2)',
					fill: true,
					tension: 0.1,
					borderWidth: 3,
					pointBackgroundColor: '#ef4444',
					pointBorderColor: '#1e293b',
					pointBorderWidth: 2,
					pointRadius: 6,
					pointHoverRadius: 8
				}];
				scales = {
					y: {
						title: {
							display: true,
							text: 'Weight (kg)',
							color: '#cbd5e1'
						},
						beginAtZero: true,
						grid: {
							color: 'rgba(203, 213, 225, 0.1)'
						},
						ticks: {
							color: '#94a3b8'
						}
					},
					x: {
						grid: {
							color: 'rgba(203, 213, 225, 0.1)'
						},
						ticks: {
							color: '#94a3b8'
						}
					}
				};
				break;
				
			case 'reps':
				datasets = [{
					label: 'Reps',
					data: sortedSessions.map(s => s.reps),
					borderColor: '#3b82f6',
					backgroundColor: 'rgba(59, 130, 246, 0.2)',
					fill: true,
					tension: 0.1,
					borderWidth: 3,
					pointBackgroundColor: '#3b82f6',
					pointBorderColor: '#1e293b',
					pointBorderWidth: 2,
					pointRadius: 6,
					pointHoverRadius: 8
				}];
				scales = {
					y: {
						title: {
							display: true,
							text: 'Repetitions',
							color: '#cbd5e1'
						},
						beginAtZero: true,
						grid: {
							color: 'rgba(203, 213, 225, 0.1)'
						},
						ticks: {
							color: '#94a3b8'
						}
					},
					x: {
						grid: {
							color: 'rgba(203, 213, 225, 0.1)'
						},
						ticks: {
							color: '#94a3b8'
						}
					}
				};
				break;
				
			case 'both':
				datasets = [
					{
						label: 'Weight (kg)',
						data: sortedSessions.map(s => s.weight),
						borderColor: '#ef4444',
						backgroundColor: 'rgba(239, 68, 68, 0.2)',
						yAxisID: 'y-weight',
						tension: 0.1,
						borderWidth: 3,
						pointBackgroundColor: '#ef4444',
						pointBorderColor: '#1e293b',
						pointBorderWidth: 2,
						pointRadius: 6,
						pointHoverRadius: 8
					},
					{
						label: 'Reps',
						data: sortedSessions.map(s => s.reps),
						borderColor: '#3b82f6',
						backgroundColor: 'rgba(59, 130, 246, 0.2)',
						yAxisID: 'y-reps',
						tension: 0.1,
						borderWidth: 3,
						pointBackgroundColor: '#3b82f6',
						pointBorderColor: '#1e293b',
						pointBorderWidth: 2,
						pointRadius: 6,
						pointHoverRadius: 8
					}
				];
				scales = {
					'y-weight': {
						type: 'linear',
						display: true,
						position: 'left',
						title: {
							display: true,
							text: 'Weight (kg)',
							color: '#cbd5e1'
						},
						beginAtZero: true,
						grid: {
							color: 'rgba(203, 213, 225, 0.1)'
						},
						ticks: {
							color: '#94a3b8'
						}
					},
					'y-reps': {
						type: 'linear',
						display: true,
						position: 'right',
						title: {
							display: true,
							text: 'Reps',
							color: '#cbd5e1'
						},
						beginAtZero: true,
						grid: {
							drawOnChartArea: false,
						},
						ticks: {
							color: '#94a3b8'
						}
					},
					x: {
						grid: {
							color: 'rgba(203, 213, 225, 0.1)'
						},
						ticks: {
							color: '#94a3b8'
						}
					}
				};
				break;
		}
		
		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels,
				datasets
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'index',
					intersect: false,
				},
				plugins: {
					title: {
						display: true,
						text: exercise.name,
						font: {
							size: 16,
							weight: 'bold'
						},
						color: '#f8fafc'
					},
					tooltip: {
						backgroundColor: 'rgba(30, 41, 59, 0.95)',
						borderColor: '#60a5fa',
						borderWidth: 1,
						titleColor: '#f8fafc',
						bodyColor: '#cbd5e1',
						callbacks: {
							title: function(context) {
								const session = sortedSessions[context[0].dataIndex];
								return session.date || `Session ${session.sessionNumber || context[0].dataIndex + 1}`;
							},
							label: function(context) {
								const session = sortedSessions[context.dataIndex];
								const baseLabel = context.dataset.label + ': ' + context.parsed.y;
								
								const labels = [baseLabel];
								
								// Show different info based on chart type
								if (chartType === 'total-volume') {
									if (session.sets && session.sets.length > 1) {
										labels.push(`Sets: ${session.sets.length}`);
										labels.push(''); // Empty line
										session.sets.forEach((set, index) => {
											const volume = (set.weight * set.reps).toFixed(1);
											labels.push(`  Set ${set.setNumber}: ${set.originalWeight}${set.originalUnit} × ${set.reps} = ${volume} vol`);
										});
									} else {
										labels.push(`Best Set: ${session.originalWeight}${session.originalUnit} × ${session.reps} reps`);
									}
								} else {
									// Show best set info for other chart types
									labels.push(`Best Set: ${session.originalWeight}${session.originalUnit} × ${session.reps} reps`);
									labels.push(`Volume: ${(session.weight * session.reps).toFixed(1)} kg×reps`);
									
									// If there are multiple sets, show all sets
									if (session.sets && session.sets.length > 1) {
										labels.push(''); // Empty line
										labels.push(`All Sets (${session.sets.length} total):`);
										session.sets.forEach((set, index) => {
											labels.push(`  Set ${set.setNumber}: ${set.originalWeight}${set.originalUnit} × ${set.reps} reps`);
										});
									}
								}
								
								return labels;
							}
						}
					},
					legend: {
						position: 'top',
						labels: {
							color: '#cbd5e1',
							font: {
								size: 12,
								weight: 500
							}
						}
					}
				},
				scales
			}
		});
	}
	
	onMount(() => {
		createChart();
		
		return () => {
			if (chart) {
				chart.destroy();
			}
		};
	});
	
	function handleChartTypeChange(): void {
		createChart();
	}
</script>

<div class="chart-wrapper">
	<div class="chart-controls">
		<label>
			<input 
				type="radio" 
				bind:group={chartType} 
				value="volume" 
				on:change={handleChartTypeChange}
			/>
			<span>📊 Best Set Volume</span>
		</label>
		<label>
			<input 
				type="radio" 
				bind:group={chartType} 
				value="total-volume" 
				on:change={handleChartTypeChange}
			/>
			<span>🔥 Total Session Volume</span>
		</label>
		<label>
			<input 
				type="radio" 
				bind:group={chartType} 
				value="weight" 
				on:change={handleChartTypeChange}
			/>
			<span>⚖️ Weight only</span>
		</label>
		<label>
			<input 
				type="radio" 
				bind:group={chartType} 
				value="reps" 
				on:change={handleChartTypeChange}
			/>
			<span>🔢 Reps only</span>
		</label>
		<label>
			<input 
				type="radio" 
				bind:group={chartType} 
				value="both" 
				on:change={handleChartTypeChange}
			/>
			<span>📈 Weight + Reps</span>
		</label>
	</div>
	
	<div class="chart-container">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>

<style>
	.chart-wrapper {
		background: var(--background-card);
		border-radius: var(--border-radius);
		padding: 1.5rem;
		box-shadow: var(--shadow-lg), var(--shadow-glow);
		border: 1px solid var(--border-light);
		margin-bottom: 2rem;
		backdrop-filter: blur(20px);
		transition: all 0.3s ease;
	}
	
	.chart-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: var(--background-elevated);
		border-radius: var(--border-radius-sm);
		border: 1px solid var(--border-light);
		backdrop-filter: blur(10px);
	}
	
	.chart-controls label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		padding: 0.5rem 0.75rem;
		border-radius: var(--border-radius-sm);
		transition: all 0.2s ease;
		border: 1px solid transparent;
	}
	
	.chart-controls label:hover {
		background: var(--background-input);
		color: var(--text-primary);
		box-shadow: var(--shadow-sm), 0 0 10px rgb(96 165 250 / 0.2);
		border-color: var(--border-accent);
		transform: translateY(-1px);
	}
	
	.chart-controls input[type="radio"] {
		margin: 0;
		accent-color: var(--primary-color);
		width: 1rem;
		height: 1rem;
	}
	
	.chart-controls input[type="radio"]:checked + span {
		color: var(--primary-color);
		font-weight: 600;
	}
	
	.chart-container {
		position: relative;
		height: 450px;
		width: 100%;
		background: var(--background-elevated);
		border-radius: var(--border-radius-sm);
		padding: 1rem;
		border: 1px solid var(--border-light);
		backdrop-filter: blur(10px);
	}
	
	@media (max-width: 968px) {
		.chart-controls {
			justify-content: center;
		}
	}
	
	@media (max-width: 768px) {
		.chart-wrapper {
			padding: 1rem;
			margin-bottom: 1.5rem;
		}
		
		.chart-controls {
			flex-direction: column;
			gap: 0.5rem;
			padding: 0.75rem;
		}
		
		.chart-controls label {
			justify-content: center;
			padding: 0.75rem;
		}
		
		.chart-container {
			height: 350px;
			padding: 0.5rem;
		}
	}
	
	@media (max-width: 480px) {
		.chart-container {
			height: 300px;
		}
	}
</style>