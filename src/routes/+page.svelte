<script lang="ts">
  import { onMount } from 'svelte';
  import { replaceState } from '$app/navigation';
  import { gsapFade } from '$lib/motion';
  import type { Player } from '$lib/players';
  import { BG_IMAGE_URL, CREDIT_URL, CREDIT_TEXT, APP_TITLE, APP_DESCRIPTION, SITE_URL } from '$lib/config';
  import { getNextIndex, type NavigationDirection } from '$lib/navigation';
  import type { ViewingMode } from '$lib/viewing-modes';
  import ModeSwitcher from '$lib/components/ModeSwitcher.svelte';
  import IndividualView from '$lib/components/IndividualView.svelte';
  import TeamGridView from '$lib/components/TeamGridView.svelte';
  import FormationView from '$lib/components/FormationView.svelte';
  import NavigationControls from '$lib/components/NavigationControls.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  // State
  // Restore whichever tab the ?mode= query points at, same idea as the player below.
  let viewingMode: ViewingMode = data.initialViewingMode;
  // Restore whichever player the ?player= query points at (set as you browse,
  // below), so reloading or navigating back to this page lands on the same card.
  let currentIndex = (() => {
    if (!data.initialPlayerId) return 0;
    const idx = data.players.findIndex((p) => String(p.id) === data.initialPlayerId);
    return idx === -1 ? 0 : idx;
  })();
  $: players = data.players;

  // Track loaded images
  let loadedImages = new Set<string>();
  let currentImageLoaded = false;

  // Which way the card should slide when the player changes
  let cardDirection: NavigationDirection | null = null;

  // replaceState can't be called until the router has finished mounting
  let routerReady = false;

  // Get current player (reactive)
  $: currentPlayer = players[currentIndex];
  $: currentImage = currentPlayer?.image || '';

  // Per-view <title>/description so a shared link (?mode=team or
  // ?player=10) previews something more specific than the generic app title.
  $: pageTitle =
    viewingMode === 'individual' && currentPlayer
      ? `${currentPlayer.firstName} ${currentPlayer.lastName.trim()} — #${currentPlayer.number ?? currentPlayer.id} | Chelsea FC Player Showcase`
      : viewingMode === 'team'
        ? 'Squad Grid — Chelsea FC Player Showcase'
        : viewingMode === 'formation'
          ? 'Formation View — Chelsea FC Player Showcase'
          : APP_TITLE;
  $: pageDescription =
    viewingMode === 'individual' && currentPlayer
      ? `${currentPlayer.firstName} ${currentPlayer.lastName.trim()}, Chelsea FC #${currentPlayer.number ?? currentPlayer.id}, plays ${currentPlayer.position}.${currentPlayer.isCaptain ? ' Team captain.' : ''} Browse the full Chelsea FC squad.`
      : APP_DESCRIPTION;

  // Roster structured data — lets search engines understand the squad as a
  // list of people rather than just an interactive card UI.
  const rosterStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: 'Chelsea FC',
    url: SITE_URL,
    athlete: data.players.map((p) => ({
      '@type': 'Person',
      name: `${p.firstName} ${p.lastName}`.trim(),
      image: new URL(p.image, SITE_URL).toString(),
      ...(p.number !== undefined ? { identifier: String(p.number) } : {}),
      memberOf: { '@type': 'SportsTeam', name: 'Chelsea FC' }
    }))
  };

  // Keep the URL pointing at the current tab and (if on the player card)
  // the current player — no new history entry per click, just enough that
  // reload or navigating back here lands in the same place.
  $: if (routerReady) {
    const url = new URL(window.location.href);
    let changed = false;

    const wantedMode = viewingMode === 'individual' ? null : viewingMode;
    if (url.searchParams.get('mode') !== wantedMode) {
      if (wantedMode) url.searchParams.set('mode', wantedMode);
      else url.searchParams.delete('mode');
      changed = true;
    }

    if (viewingMode === 'individual' && currentPlayer) {
      if (url.searchParams.get('player') !== String(currentPlayer.id)) {
        url.searchParams.set('player', String(currentPlayer.id));
        changed = true;
      }
    }

    if (changed) replaceState(url, {});
  }

  // Image loaded handler
  function handleImageLoad(imageSrc: string): void {
    loadedImages.add(imageSrc);
    if (imageSrc === currentImage) {
      currentImageLoaded = true;
    }
  }

  // Preload image
  function preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (loadedImages.has(src)) {
        resolve();
        return;
      }
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedImages.add(src);
        resolve();
      };
      img.onerror = reject;
    });
  }

  // Preload a player's photo and country flag together — the flag is small,
  // but without this it fetches on demand and pops in late on every switch.
  function preloadPlayerAssets(player: Player): Promise<void> {
    const loads = [preloadImage(player.image)];
    if (player.countryImage) loads.push(preloadImage(player.countryImage));
    return Promise.all(loads).then(() => undefined);
  }

  // Change viewing mode
  function setViewingMode(mode: ViewingMode): void {
    viewingMode = mode;
  }

  // Navigate
  async function navigate(direction: NavigationDirection): Promise<void> {
    if (viewingMode !== 'individual' || players.length === 0) return;

    const nextIndex = getNextIndex(currentIndex, players.length, direction);
    const nextPlayer = players[nextIndex];
    cardDirection = direction;

    // Only drop into the loading skeleton if this player's assets genuinely
    // aren't cached yet — they usually are, since we preload neighbors ahead
    // of time, and flashing the skeleton on every click looked broken.
    const alreadyLoaded =
      loadedImages.has(nextPlayer.image) &&
      (!nextPlayer.countryImage || loadedImages.has(nextPlayer.countryImage));

    if (!alreadyLoaded) {
      currentImageLoaded = false;
      await preloadPlayerAssets(nextPlayer);
    }

    currentIndex = nextIndex;
    currentImageLoaded = true;
  }

  function prev(): void {
    navigate('prev');
  }

  function next(): void {
    navigate('next');
  }

  // Select player
  async function selectPlayer(player: Player): Promise<void> {
    const index = players.findIndex((p) => p.id === player.id);
    if (index !== -1) {
      // Jumping in from the grid/formation view has no inherent direction
      cardDirection = null;
      // Preload before switching
      currentImageLoaded =
        loadedImages.has(player.image) && (!player.countryImage || loadedImages.has(player.countryImage));
      if (!currentImageLoaded) {
        await preloadPlayerAssets(player);
        currentImageLoaded = true;
      }
      currentIndex = index;
      viewingMode = 'individual';
    }
  }

  // Keyboard navigation
  function handleKeydown(event: KeyboardEvent): void {
    if (viewingMode === 'individual') {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        navigate('next');
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        navigate('prev');
      }
    }
    if (event.key === '1') setViewingMode('individual');
    if (event.key === '2') setViewingMode('team');
    if (event.key === '3') setViewingMode('formation');
  }

  // Preload critical images on mount
  onMount(() => {
    // This app's legacy-mode components mount via a synchronous flushSync,
    // so even onMount still runs before SvelteKit's router finishes
    // initializing — defer past that with a macrotask so replaceState is safe.
    setTimeout(() => {
      routerReady = true;
    }, 0);

    if (players.length === 0) return;

    // Mark current player's photo + flag as the target
    preloadPlayerAssets(currentPlayer).then(() => {
      currentImageLoaded = true;
    });

    // Preload adjacent players' photo + flag
    const prevIndex = getNextIndex(currentIndex, players.length, 'prev');
    const nextIndex = getNextIndex(currentIndex, players.length, 'next');
    preloadPlayerAssets(players[prevIndex]);
    preloadPlayerAssets(players[nextIndex]);
  });
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  {@html `<script type="application/ld+json">${JSON.stringify(rosterStructuredData)}</` + `script>`}
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<a href="#main-content" class="skip-link">Skip to content</a>

<h1 class="sr-only">{APP_TITLE}</h1>

<div
  class="flex flex-col items-center justify-center min-h-dvh relative overflow-hidden"
  style="background-image: url('{BG_IMAGE_URL}'); background-size: cover; background-position: center;"
>
  <div
    class="absolute top-0 left-0 w-full h-full z-0
           bg-gradient-to-b from-ink/80 via-ink/70 to-ink/90"
  ></div>
  <div
    class="absolute top-0 left-0 w-full h-full z-0"
    style="background: radial-gradient(circle at 50% 30%, rgba(29,70,150,0.18), transparent 60%);"
  ></div>

  <ModeSwitcher currentMode={viewingMode} setViewingMode={setViewingMode} />

  <!-- Credit -->
  <div class="absolute bottom-0 right-0 text-gray-400 text-xs p-2 z-10">
    <a href={CREDIT_URL} target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">
      {CREDIT_TEXT}
    </a>
  </div>

  <!-- Hidden preloader images -->
  <div class="hidden">
    {#each players as player}
      <img
        src={player.image}
        alt=""
        loading="lazy"
        on:load={() => handleImageLoad(player.image)}
      />
      {#if player.countryImage}
        <img
          src={player.countryImage}
          alt=""
          loading="lazy"
          on:load={() => handleImageLoad(player.countryImage ?? '')}
        />
      {/if}
    {/each}
  </div>

  <!-- MAIN CONTENT -->
  <main id="main-content" class="relative z-10 w-full h-full flex items-center justify-center p-4 pt-20 pb-24">
    {#key viewingMode}
      <div
        in:gsapFade={{ duration: 380, delay: 200 }}
        out:gsapFade={{ duration: 200 }}
        class="w-full h-full flex items-center justify-center"
      >
        {#if viewingMode === 'individual'}
          <IndividualView
            player={currentPlayer}
            isLoading={!currentImageLoaded}
            direction={cardDirection}
            canEdit={data.canManage}
          />
        {:else if viewingMode === 'team'}
          <TeamGridView players={players} onSelectPlayer={selectPlayer} />
        {:else if viewingMode === 'formation'}
          <FormationView players={players} onSelectPlayer={selectPlayer} />
        {/if}
      </div>
    {/key}
  </main>

  <!-- Navigation -->
  {#if viewingMode === 'individual'}
    <NavigationControls onPrev={prev} onNext={next} />
  {/if}

  <!-- Manage squad (only from this computer) -->
  {#if data.canManage}
    <a
      href="/manage"
      class="fixed top-4 right-4 z-50 text-gray-300 hover:text-white bg-ink/70 border border-white/10
             backdrop-blur-md rounded-full p-2.5 transition-all duration-200
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      aria-label="Manage squad"
      title="Manage squad"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
    </a>
  {/if}
</div>
