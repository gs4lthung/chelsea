<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Page not found — Chelsea FC Player Showcase</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div
	class="flex flex-col items-center justify-center min-h-dvh relative overflow-hidden bg-ink text-white px-4"
>
	<div
		class="absolute inset-0 z-0"
		style="background: radial-gradient(circle at 50% 30%, rgba(29,70,150,0.22), transparent 60%);"
	></div>

	<div class="relative z-10 flex flex-col items-center text-center gap-4 max-w-md">
		<p class="player-number text-chelsea-blue-light text-lg tracking-widest">
			{$page.status}
		</p>
		<h1 class="player-name text-4xl sm:text-5xl">
			{#if $page.status === 404}
				That player isn't on the squad
			{:else if $page.status === 403}
				This computer only
			{:else}
				Something went wrong
			{/if}
		</h1>
		<p class="text-gray-400">
			{#if $page.status === 404}
				We couldn't find the page you're looking for. It may have been moved or the link is out of date.
			{:else}
				{$page.error?.message ?? 'An unexpected error occurred.'}
			{/if}
		</p>
		<a
			href="/"
			class="mt-2 bg-chelsea-blue hover:bg-chelsea-blue-light active:scale-95 px-5 py-2.5 rounded-lg
			       text-sm font-medium transition-all duration-200
			       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
		>
			Back to the squad
		</a>
	</div>
</div>
