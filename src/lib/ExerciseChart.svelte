<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import type { Exercise, ChartViewMode, ExerciseSession } from '$lib/types';
	
	export let exercise: Exercise;
	
	let canvas: HTMLCanvasElement;
	let chart: Chart | undefined;
	let chartType: ChartViewMode = 'volume';
	let chartColor: string = '#60a5fa';
	let yAxisScale: 'linear' | 'logarithmic' = 'linear';

	const sortedSessions = [...exercise.sessions].sort((a, b) => {
		if (a.sessionNumber && b.sessionNumber) {
			return a.sessionNumber - b.sessionNumber;
		}
		return new Date(a.date) - new Date(b.date);
	});

	function getTooltipTitle(context: any[]): string {
		const session = sortedSessions[context[0].dataIndex];
		return session.date || `Session ${session.sessionNumber || context[0].dataIndex + 1}`;
	}

	function getTooltipLabel(context: any): string[] {
		const session = sortedSessions[context.dataIndex];
		const baseLabel = `${context.dataset.label}: ${context.parsed.y}`;
		const labels = [baseLabel];

		if (session.isPR) {
			labels.push('🏆 Personal Record!');
		}

		if (chartType === 'total-volume') {
			if (session.sets && session.sets.length > 1) {
				labels.push(`Sets: ${session.sets.length}`);
				labels.push('');
				session.sets.forEach((set) => {
					const volume = (set.weight * set.reps).toFixed(1);
					labels.push(`  Set ${set.setNumber}: ${set.originalWeight}${set.originalUnit} × ${set.reps} = ${volume} vol`);
				});
			} else {
				labels.push(`Best Set: ${session.originalWeight}${session.originalUnit} × ${session.reps} reps`);
			}
		} else {
			labels.push(`Best Set: ${session.originalWeight}${session.originalUnit} × ${session.reps} reps`);
			labels.push(`Volume: ${(session.weight * session.reps).toFixed(1)} kg×reps`);

			if (session.sets && session.sets.length > 1) {
				labels.push('');
				labels.push(`All Sets (${session.sets.length} total):`);
				session.sets.forEach((set) => {
					labels.push(`  Set ${set.setNumber}: ${set.originalWeight}${set.originalUnit} × ${set.reps} reps`);
				});
			}
		}

		return labels;
	}
	
	function createChart(): void {
		if (chart) {
			chart.destroy();
		}
		
		const ctx = canvas.getContext('2d');
		
		const labels = sortedSessions.map((s, index) => 
			s.sessionNumber ? `Session ${s.sessionNumber}` : s.date || `Workout ${index + 1}`
		);
		
		let datasets = [];
		let scales = {};
		
		switch (chartType) {
			case 'volume':
				datasets = [{
					label: 'Best Set Volume (kg × reps)',
					data: sortedSessions.map(s => s.weight * s.reps),
					borderColor: chartColor,
					backgroundColor: 'rgba(96, 165, 250, 0.2)',
					fill: true,
					tension: 0.1,
					borderWidth: 3,
					pointBackgroundColor: sortedSessions.map(s => s.isPR ? '#f472b6' : chartColor),
					pointBorderColor: '#1e293b',
					pointBorderWidth: 2,
					pointRadius: sortedSessions.map(s => s.isPR ? 8 : 6),
					pointHoverRadius: sortedSessions.map(s => s.isPR ? 10 : 8)
				}];
				scales = {
					y: {
						type: yAxisScale,
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
				datasets = [{
					label: 'Total Session Volume (kg × reps)',
					data: sortedSessions.map(s => {
						if (s.sets && s.sets.length > 0) {
							return s.sets.reduce((total, set) => total + (set.weight * set.reps), 0);
						}
						return s.weight * s.reps;
					}),
					borderColor: chartColor,
					backgroundColor: 'rgba(244, 114, 182, 0.2)',
					fill: true,
					tension: 0.1,
					borderWidth: 3,
					pointBackgroundColor: sortedSessions.map(s => s.isPR ? '#f472b6' : chartColor),
					pointBorderColor: '#1e293b',
					pointBorderWidth: 2,
					pointRadius: sortedSessions.map(s => s.isPR ? 8 : 6),
					pointHoverRadius: sortedSessions.map(s => s.isPR ? 10 : 8)
				}];
				scales = {
					y: {
						type: yAxisScale,
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
					borderColor: chartColor,
					backgroundColor: 'rgba(239, 68, 68, 0.2)',
					fill: true,
					tension: 0.1,
					borderWidth: 3,
					pointBackgroundColor: sortedSessions.map(s => s.isPR ? '#f472b6' : chartColor),
					pointBorderColor: '#1e293b',
					pointBorderWidth: 2,
					pointRadius: sortedSessions.map(s => s.isPR ? 8 : 6),
					pointHoverRadius: sortedSessions.map(s => s.isPR ? 10 : 8)
				}];
				scales = {
					y: {
						type: yAxisScale,
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
					borderColor: chartColor,
					backgroundColor: 'rgba(59, 130, 246, 0.2)',
					fill: true,
					tension: 0.1,
					borderWidth: 3,
					pointBackgroundColor: sortedSessions.map(s => s.isPR ? '#f472b6' : chartColor),
					pointBorderColor: '#1e293b',
					pointBorderWidth: 2,
					pointRadius: sortedSessions.map(s => s.isPR ? 8 : 6),
					pointHoverRadius: sortedSessions.map(s => s.isPR ? 10 : 8)
				}];
				scales = {
					y: {
						type: yAxisScale,
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
						borderColor: chartColor,
						backgroundColor: 'rgba(239, 68, 68, 0.2)',
						yAxisID: 'y-weight',
						tension: 0.1,
						borderWidth: 3,
						pointBackgroundColor: sortedSessions.map(s => s.isPR ? '#f472b6' : chartColor),
						pointBorderColor: '#1e293b',
						pointBorderWidth: 2,
						pointRadius: sortedSessions.map(s => s.isPR ? 8 : 6),
						pointHoverRadius: sortedSessions.map(s => s.isPR ? 10 : 8)
					},
					{
						label: 'Reps',
						data: sortedSessions.map(s => s.reps),
						borderColor: '#3b82f6',
						backgroundColor: 'rgba(59, 130, 246, 0.2)',
						yAxisID: 'y-reps',
						tension: 0.1,
						borderWidth: 3,
						pointBackgroundColor: sortedSessions.map(s => s.isPR ? '#f472b6' : '#3b82f6'),
						pointBorderColor: '#1e293b',
						pointBorderWidth: 2,
						pointRadius: sortedSessions.map(s => s.isPR ? 8 : 6),
						pointHoverRadius: sortedSessions.map(s => s.isPR ? 10 : 8)
					}
				];
				scales = {
					'y-weight': {
						type: yAxisScale,
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
						type: yAxisScale,
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
							title: getTooltipTitle,
							label: getTooltipLabel
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
	<div class="chart-customization">
		<label>
			Chart Color:
			<input type="color" bind:value={chartColor} on:input={createChart} />
		</label>
		<label>
			Y-Axis Scale:
			<select bind:value={yAxisScale} on:change={createChart}>
				<option value="linear">Linear</option>
				<option value="logarithmic">Logarithmic</option>
			</select>
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

	.chart-customization {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
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
