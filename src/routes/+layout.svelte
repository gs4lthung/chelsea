<script lang="ts">
	import '../app.css';
	import { APP_TITLE, APP_DESCRIPTION } from '$lib/config';

	let { children } = $props();
</script>

<svelte:head>
	<title>{APP_TITLE}</title>
	<meta name="description" content={APP_DESCRIPTION} />
	<meta property="og:title" content={APP_TITLE} />
	<meta property="og:description" content={APP_DESCRIPTION} />
	<meta property="og:image" content="/favicon.png" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
</svelte:head>

{@render children()}
