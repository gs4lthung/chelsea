<script lang="ts">
  import type { Player } from '$lib/players';
  import type { FormationSlot } from '$lib/viewing-modes';
  import { getFormationSlots } from '$lib/viewing-modes';
  import { gsapFade, gsapPop } from '$lib/motion';

  export let players: Player[];
  export let onSelectPlayer: (player: Player) => void;

  $: formationSlots = getFormationSlots(players);

  function getPlayersForSlot(slot: FormationSlot): Player[] {
    return players.filter((p) => slot.playerIds.includes(p.id));
  }
</script>

<div class="w-full max-w-5xl">
  <h2 class="text-3xl text-white text-center mb-8 player-name">
    4-3-3 formation
  </h2>

  <div
    in:gsapFade={{ duration: 450 }}
    class="relative w-full bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950
           rounded-xl border border-white/15 shadow-[0_24px_60px_-16px_rgba(4,20,14,0.7)] overflow-hidden"
    style="aspect-ratio: 2/3;"
  >
    <div class="absolute inset-0">
      <div class="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30"></div>
      <div
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
               w-24 h-24 rounded-full border-2 border-white/30"
      ></div>
      <div
        class="absolute bottom-0 left-1/2 transform -translate-x-1/2
               w-3/4 h-1/4 border-2 border-white/30 border-b-0"
      ></div>
      <div
        class="absolute top-0 left-1/2 transform -translate-x-1/2
               w-3/4 h-1/4 border-2 border-white/30 border-t-0"
      ></div>
    </div>

    {#each formationSlots as slot, slotIndex}
      <div
        class="absolute transform -translate-x-1/2 -translate-y-1/2"
        style="left: {slot.x}%; top: {slot.y}%;"
      >
        <div class="text-white/50 text-xs font-bold text-center mb-1">
          {slot.label}
        </div>
        <div class="flex flex-wrap justify-center gap-1">
          {#each getPlayersForSlot(slot) as player, playerIndex (player.id)}
            <button
              type="button"
              in:gsapPop={{
                duration: 480,
                delay: Math.min(slotIndex * 70 + playerIndex * 30, 700),
                start: 0.4,
                ease: 'back.out(1.7)',
              }}
              class="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full
                     bg-chelsea-blue border-2 border-white/80
                     hover:bg-chelsea-blue-light hover:scale-110
                     flex items-center justify-center
                     cursor-pointer transition-all duration-200
                     shadow-[0_6px_16px_-4px_rgba(10,20,50,0.6)]
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-white focus-visible:ring-offset-2
                     focus-visible:ring-offset-emerald-950
                     {player.isCaptain ? 'captain-glow ring-2 ring-chelsea-gold' : ''}
                     {player.position === 'Manager' ? 'manager-glow ring-2 ring-chelsea-blue-light' : ''}
                     {player.isSuspended ? 'ring-2 ring-chelsea-red' : ''}"
              on:click={() => onSelectPlayer(player)}
              title="{player.firstName} {player.lastName.trim()}"
            >
              <span class="player-number text-white font-bold text-sm">{player.number ?? player.id}</span>
              {#if player.isCaptain}
                <span
                  class="captain-badge absolute -top-1 -right-1 w-4 h-4 rounded-full
                         flex items-center justify-center text-[9px] font-bold"
                >
                  C
                </span>
              {:else if player.position === 'Manager'}
                <span
                  class="manager-badge absolute -top-1 -right-1 w-4 h-4 rounded-full
                         flex items-center justify-center text-[9px] font-bold"
                >
                  M
                </span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
