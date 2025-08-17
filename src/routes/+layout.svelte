<script>
	import '../app.css';
	import ThemeSwitcher from '$lib/ThemeSwitcher.svelte';
	import AuthStatus from '$lib/AuthStatus.svelte';
</script>

<header>
	<div class="header-content">
		<h1>Gym Tracker</h1>
		<div class="header-actions">
			<ThemeSwitcher />
			<AuthStatus />
		</div>
	</div>
</header>

<main>
	<slot />
</main>

<style>
	header {
		background: var(--color-surface, #ffffff);
		border-bottom: 1px solid var(--color-border, #e0e0e0);
		padding: 1rem 2rem;
		margin-bottom: 2rem;
	}
	
	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	h1 {
		margin: 0;
		font-size: 1.5rem;
		color: var(--color-text, #333);
	}
	
	.header-actions {
		display: flex;
		gap: 1.5rem;
		align-items: center;
	}
	
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}
</style>
