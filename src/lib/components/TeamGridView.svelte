<script lang="ts">
  import type { Player } from '$lib/players';
  import { gsapFly } from '$lib/motion';

  export let players: Player[];
  export let onSelectPlayer: (player: Player) => void;
</script>

<div class="w-full max-w-7xl">
  <h2 class="text-3xl text-white text-center mb-8 player-name">
    Chelsea FC squad
  </h2>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
    {#each players as player, index (player.id)}
      <button
        type="button"
        on:click={() => onSelectPlayer(player)}
        in:gsapFly={{
          y: 20,
          duration: 480,
          delay: Math.min(index * 20, 400),
          ease: 'power3.out',
        }}
        class="cursor-pointer text-left rounded-lg
               focus-visible:outline-none focus-visible:ring-2
               focus-visible:ring-chelsea-blue-light focus-visible:ring-offset-2
               focus-visible:ring-offset-ink"
      >
        <div
          class="group relative flex flex-col items-center justify-center
                 w-full h-48 sm:h-56
                 rounded-lg border border-white/10 text-white
                 shadow-[0_10px_25px_-8px_rgba(10,20,50,0.6)]
                 hover:shadow-[0_16px_34px_-8px_rgba(29,70,150,0.5)]
                 hover:border-chelsea-blue-light/60
                 hover:-translate-y-1
                 transition-all duration-300
                 {player.isCaptain ? 'captain-glow' : ''}
                 {player.isSuspended ? 'suspended-glow' : ''}"
        >
          <!-- Lazy loaded background image -->
          <div
            class="absolute inset-0 bg-cover bg-center bg-no-repeat rounded-lg"
            style="background-image: url('{player.image}');"
          ></div>

          <!-- Gradient overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent rounded-lg"></div>

          <div class="absolute top-2 right-2 text-lg font-bold text-white
                       bg-gradient-to-br from-chelsea-blue to-chelsea-blue-dark
                       px-2 py-1 rounded-lg shadow-md
                       ring-1 ring-white/25 backdrop-blur-md z-10">
            {player.number ?? player.id}
          </div>

          {#if player.isCaptain}
            <div
              class="captain-badge absolute top-2 left-2 z-10 flex items-center justify-center
                     w-6 h-6 rounded-full text-[11px] font-bold"
              title="Team captain"
            >
              C
            </div>
          {/if}

          <div
            class="absolute inset-0 bg-ink/80 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100
                   flex flex-col items-center justify-center
                   transition-opacity duration-300
                   rounded-lg pointer-events-none z-20"
          >
            <p class="player-name text-lg text-center px-2">
              {player.firstName}
              <span class="bg-white/95 text-ink px-1 rounded text-sm ml-1">
                {player.lastName.trim()}
              </span>
            </p>
            <p class="text-xs text-chelsea-blue-light mt-2">{player.position}</p>
          </div>

          {#if player.countryImage}
            <img
              src={player.countryImage}
              alt="{player.firstName} {player.lastName.trim()}'s national team"
              class="absolute bottom-2 right-2 w-8 h-5 rounded-sm opacity-70 z-10"
              loading="lazy"
              decoding="async"
            />
          {/if}
        </div>
      </button>
    {/each}
  </div>
</div>
