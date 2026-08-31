<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { APP_TITLE, APP_DESCRIPTION, SITE_NAME, SITE_URL, OG_IMAGE_URL } from '$lib/config';

	let { children } = $props();

	// Canonical always points at the bare path, never the ?mode=/?player=
	// query variants — those are the same content from a crawler's point of
	// view, so folding them into one indexed URL avoids duplicate-content dilution.
	let canonicalUrl = $derived($page?.url ? `${SITE_URL}${$page.url.pathname}` : SITE_URL);

	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE_NAME,
		url: SITE_URL,
		description: APP_DESCRIPTION,
		about: {
			'@type': 'SportsTeam',
			name: 'Chelsea FC',
			sport: 'Football'
		}
	};
</script>

<svelte:head>
	<link rel="canonical" href={canonicalUrl} />

	<meta property="og:title" content={APP_TITLE} />
	<meta property="og:description" content={APP_DESCRIPTION} />
	<meta property="og:image" content={OG_IMAGE_URL} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="1200" />
	<meta property="og:image:alt" content="Chelsea FC crest" />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={APP_TITLE} />
	<meta name="twitter:description" content={APP_DESCRIPTION} />
	<meta name="twitter:image" content={OG_IMAGE_URL} />

	{@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</` + `script>`}
</svelte:head>

{@render children()}
