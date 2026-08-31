<script lang="ts">
  import type { Player } from '$lib/players';
  import { getBackgroundStyle } from '$lib/image-utils';
  import { gsapFly, gsapFade, gsapCardIn } from '$lib/motion';

  export let player: Player | null;
  export let isLoading = false;
  /** Which way we're navigating, so the card slides the direction that makes sense. */
  export let direction: 'next' | 'prev' | null = null;
  /** Only the machine running the server can edit the squad. */
  export let canEdit = false;

  $: slideX = direction === 'prev' ? -70 : direction === 'next' ? 70 : 0;
  $: cardEnter = { x: slideX, duration: 620, ease: 'back.out(1.5)' };
  $: cardExit = { x: -slideX, duration: 320, ease: 'power2.in' };

  // Utility function
  const resizePlayerName = (name: string) =>
    name.length > 20 ? 'font-size: 24px' : 'font-size: 30px';
</script>

{#if player}
  {#key player.id}
  {#if !isLoading}
    <!-- Player Card -->
    <div
      in:gsapCardIn={cardEnter}
      out:gsapFly={cardExit}
      class="relative flex flex-col items-center justify-center
             w-full max-w-[350px] aspect-[7/10]
             bg-cover bg-center bg-no-repeat
             rounded-xl border border-white/10 text-white
             shadow-[0_24px_50px_-12px_rgba(10,20,50,0.55)]
             hover:shadow-[0_28px_60px_-10px_rgba(29,70,150,0.4)]
             hover:-translate-y-1
             transition-shadow duration-300
             {player.isCaptain ? 'captain-glow' : ''}
             {player.isSuspended ? 'suspended-glow' : ''}"
      style={getBackgroundStyle(player.image)}
    >
      <!-- Bottom scrim for legibility -->
      <div
        class="absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl
               bg-gradient-to-t from-ink/90 via-ink/40 to-transparent pointer-events-none"
      ></div>

      {#if player.isCaptain}
        <div
          class="captain-badge absolute top-4 left-4 z-10 flex items-center gap-1
                 pl-1.5 pr-2.5 py-1 rounded-full text-xs font-bold tracking-wide"
          title="Team captain"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16 3 5l5.5 4L12 4l3.5 5L21 5l-2 11z" /></svg>
          CAPTAIN
        </div>
      {/if}

      {#if canEdit}
        <a
          href="/manage?edit={player.id}"
          class="absolute z-10 text-white/70 hover:text-white bg-black/30 hover:bg-black/50
                 backdrop-blur-md rounded-full p-2 transition-all duration-200
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70
                 {player.isCaptain ? 'top-14' : 'top-4'} left-4"
          aria-label="Edit {player.firstName} {player.lastName.trim()}"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
        </a>
      {/if}

      <p
        class="player-name absolute bottom-3 left-4 z-10"
        style={resizePlayerName(player.firstName + player.lastName)}
      >
        {player.firstName}
        <span class="bg-white/95 text-ink px-2 rounded">
          {player.lastName.trim()}
        </span>
      </p>

      <p
        class="player-number absolute bottom-3 right-3 z-10 text-2xl font-bold text-white
               bg-gradient-to-br from-chelsea-blue to-chelsea-blue-dark
               px-3 py-1 rounded-lg shadow-[0_8px_20px_-4px_rgba(14,42,94,0.7)]
               ring-1 ring-white/25 backdrop-blur-md"
      >
        {player.number ?? player.id}
      </p>

      {#if player.countryImage}
        <img
          src={player.countryImage}
          alt="{player.firstName} {player.lastName.trim()}'s national team"
          class="absolute top-4 right-4 w-12 h-8 rounded-sm shadow-md z-10"
          decoding="async"
        />
      {/if}
    </div>
  {:else}
    <!-- Loading Skeleton (matches card shape) -->
    <div
      in:gsapFade={{ duration: 220 }}
      class="relative flex flex-col justify-end
             w-full max-w-[350px] aspect-[7/10]
             skeleton-metal rounded-xl border border-white/10 overflow-hidden"
    >
      <div class="absolute inset-0 skeleton-shimmer"></div>
      <div class="relative z-10 p-4 flex items-end justify-between">
        <div class="h-6 w-32 rounded bg-white/10"></div>
        <div class="h-8 w-12 rounded-lg bg-white/10"></div>
      </div>
    </div>
  {/if}
  {/key}
{/if}
