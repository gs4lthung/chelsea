<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto, invalidateAll } from '$app/navigation';
  import type { Player } from '$lib/players';
  import { addPlayer, updatePlayer, deletePlayer, restorePlayer, type PlayerFormData } from '$lib/roster';
  import { addFlag, updateFlag, deleteFlag, type CountryFlag } from '$lib/flags';
  import PlayerForm from '$lib/components/PlayerForm.svelte';
  import FlagForm from '$lib/components/FlagForm.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  $: roster = data.players;
  $: removed = data.removed;
  $: flags = data.flags;
  $: nextNumber = roster.reduce((max, p) => Math.max(max, p.number ?? 0), 0) + 1;

  let formOpen = false;
  let editingPlayer: Player | null = null;
  let pendingDeleteId: Player['id'] | null = null;
  let actionError = '';
  let formSection: HTMLDivElement;

  let flagFormOpen = false;
  let editingFlag: CountryFlag | null = null;
  let pendingDeleteFlagId: string | null = null;
  let flagActionError = '';

  function scrollToForm(): void {
    requestAnimationFrame(() =>
      formSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
  }

  function openAddForm(): void {
    editingPlayer = null;
    formOpen = true;
    scrollToForm();
  }

  function openEditForm(player: Player): void {
    editingPlayer = player;
    formOpen = true;
    scrollToForm();
  }

  function closeForm(): void {
    formOpen = false;
    editingPlayer = null;
  }

  async function handleFormSubmit(data: PlayerFormData): Promise<void> {
    if (editingPlayer) {
      await updatePlayer(editingPlayer.id, data);
    } else {
      await addPlayer(data);
    }
    await invalidateAll();
    closeForm();
  }

  function requestDelete(id: Player['id']): void {
    pendingDeleteId = id;
  }

  function cancelDelete(): void {
    pendingDeleteId = null;
  }

  async function confirmDelete(id: Player['id']): Promise<void> {
    actionError = '';
    try {
      await deletePlayer(id);
      if (editingPlayer?.id === id) closeForm();
      await invalidateAll();
    } catch (err) {
      actionError = err instanceof Error ? err.message : 'Could not delete this player.';
    } finally {
      pendingDeleteId = null;
    }
  }

  async function handleRestore(id: Player['id']): Promise<void> {
    actionError = '';
    try {
      await restorePlayer(id);
      await invalidateAll();
    } catch (err) {
      actionError = err instanceof Error ? err.message : 'Could not restore this player.';
    }
  }

  function openAddFlagForm(): void {
    editingFlag = null;
    flagFormOpen = true;
  }

  function openEditFlagForm(flag: CountryFlag): void {
    editingFlag = flag;
    flagFormOpen = true;
  }

  function closeFlagForm(): void {
    flagFormOpen = false;
    editingFlag = null;
  }

  async function handleFlagFormSubmit(data: { name: string; image: string }): Promise<void> {
    if (editingFlag) {
      await updateFlag(editingFlag.id, data);
    } else {
      await addFlag(data);
    }
    await invalidateAll();
    closeFlagForm();
  }

  function requestDeleteFlag(id: string): void {
    pendingDeleteFlagId = id;
  }

  function cancelDeleteFlag(): void {
    pendingDeleteFlagId = null;
  }

  async function confirmDeleteFlag(id: string): Promise<void> {
    flagActionError = '';
    try {
      await deleteFlag(id);
      if (editingFlag?.id === id) closeFlagForm();
      await invalidateAll();
    } catch (err) {
      flagActionError = err instanceof Error ? err.message : 'Could not delete this flag.';
    } finally {
      pendingDeleteFlagId = null;
    }
  }

  onMount(() => {
    const editId = $page.url.searchParams.get('edit');
    if (editId) {
      const target = roster.find((p) => String(p.id) === editId);
      if (target) openEditForm(target);
      // This app's legacy-mode components mount via a synchronous flushSync,
      // so even onMount can still run before SvelteKit's router finishes
      // initializing — defer past that with a macrotask so goto() is safe.
      setTimeout(() => {
        goto('/manage', { replaceState: true, noScroll: true });
      }, 0);
    }
  });
</script>

<svelte:head>
  <title>Manage squad — Chelsea FC Player Showcase</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-dvh bg-ink text-white">
  <div class="max-w-4xl mx-auto px-4 py-10">
    <div class="flex flex-wrap items-start justify-between gap-4 mb-8">
      <div>
        <a
          href="/"
          class="text-sm text-chelsea-blue-light hover:text-white transition-colors
                 inline-flex items-center gap-1 mb-3
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light rounded"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Back to showcase
        </a>
        <h1 class="player-name text-3xl">Manage squad</h1>
        <p class="text-gray-400 text-sm mt-1">Changes are saved to the squad database.</p>
      </div>
      <button
        type="button"
        on:click={openAddForm}
        class="px-4 py-2 rounded-lg text-sm font-medium bg-chelsea-blue hover:bg-chelsea-blue-light
               active:scale-95 text-white transition-all duration-200
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        + Add player
      </button>
    </div>

    {#if actionError}
      <p class="text-sm text-chelsea-red mb-4">{actionError}</p>
    {/if}

    {#if formOpen}
      <div bind:this={formSection} class="mb-8">
        <PlayerForm
          initial={editingPlayer}
          suggestedNumber={nextNumber}
          {flags}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
        />
      </div>
    {/if}

    <div class="flex flex-col gap-2">
      {#each roster as p (p.id)}
        <div class="flex items-center gap-4 bg-ink-soft border border-white/10 rounded-lg p-3">
          <div
            class="w-12 h-12 rounded-lg bg-cover bg-center bg-black/30 flex-shrink-0"
            style="background-image: url('{p.image}')"
          ></div>
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate flex items-center gap-1.5">
              {p.firstName} {p.lastName.trim()}
              {#if p.isCaptain}
                <span class="captain-badge text-[10px] px-1.5 py-0.5 rounded-full font-bold">C</span>
              {/if}
              {#if p.isSuspended}
                <span class="text-[10px] text-chelsea-red border border-chelsea-red/50 rounded px-1.5 py-0.5">suspended</span>
              {/if}
            </p>
            <p class="text-xs text-gray-400 truncate">#{p.number ?? p.id} · {p.position}</p>
          </div>
          {#if pendingDeleteId === p.id}
            <div class="flex items-center gap-2 text-sm flex-shrink-0">
              <span class="text-gray-400 hidden sm:inline">Delete?</span>
              <button
                type="button"
                on:click={() => confirmDelete(p.id)}
                class="text-chelsea-red hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light rounded"
              >
                Confirm
              </button>
              <button
                type="button"
                on:click={cancelDelete}
                class="text-gray-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light rounded"
              >
                Cancel
              </button>
            </div>
          {:else}
            <div class="flex items-center gap-3 flex-shrink-0 text-sm">
              <button
                type="button"
                on:click={() => openEditForm(p)}
                class="text-chelsea-blue-light hover:text-white transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light rounded"
              >
                Edit
              </button>
              <button
                type="button"
                on:click={() => requestDelete(p.id)}
                class="text-chelsea-red hover:text-red-400 transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light rounded"
              >
                Delete
              </button>
            </div>
          {/if}
        </div>
      {:else}
        <p class="text-gray-400 text-sm py-8 text-center">No players yet. Add one to get started.</p>
      {/each}
    </div>

    <div class="mt-10">
      <div class="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 class="player-name text-xl">Country flags</h2>
          <p class="text-gray-400 text-sm mt-1">Reusable flags offered in the player form's country picker.</p>
        </div>
        <button
          type="button"
          on:click={openAddFlagForm}
          class="px-3 py-1.5 rounded-lg text-sm font-medium bg-chelsea-blue hover:bg-chelsea-blue-light
                 active:scale-95 text-white transition-all duration-200
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          + Add flag
        </button>
      </div>

      {#if flagActionError}
        <p class="text-sm text-chelsea-red mb-4">{flagActionError}</p>
      {/if}

      {#if flagFormOpen}
        <div class="mb-4">
          <FlagForm
            initial={editingFlag}
            onSubmit={handleFlagFormSubmit}
            onCancel={closeFlagForm}
          />
        </div>
      {/if}

      <div class="flex flex-col gap-2">
        {#each flags as flag (flag.id)}
          <div class="flex items-center gap-4 bg-ink-soft border border-white/10 rounded-lg p-3">
            <div
              class="w-9 h-6 rounded-sm bg-cover bg-center bg-black/30 border border-white/15 flex-shrink-0"
              style="background-image: url('{flag.image}')"
            ></div>
            <p class="flex-1 min-w-0 font-medium truncate">{flag.name}</p>
            {#if pendingDeleteFlagId === flag.id}
              <div class="flex items-center gap-2 text-sm flex-shrink-0">
                <span class="text-gray-400 hidden sm:inline">Delete?</span>
                <button
                  type="button"
                  on:click={() => confirmDeleteFlag(flag.id)}
                  class="text-chelsea-red hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light rounded"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  on:click={cancelDeleteFlag}
                  class="text-gray-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light rounded"
                >
                  Cancel
                </button>
              </div>
            {:else}
              <div class="flex items-center gap-3 flex-shrink-0 text-sm">
                <button
                  type="button"
                  on:click={() => openEditFlagForm(flag)}
                  class="text-chelsea-blue-light hover:text-white transition-colors
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light rounded"
                >
                  Edit
                </button>
                <button
                  type="button"
                  on:click={() => requestDeleteFlag(flag.id)}
                  class="text-chelsea-red hover:text-red-400 transition-colors
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light rounded"
                >
                  Delete
                </button>
              </div>
            {/if}
          </div>
        {:else}
          <p class="text-gray-400 text-sm py-8 text-center">No flags yet. Add one to get started.</p>
        {/each}
      </div>
    </div>

    {#if removed.length}
      <details class="mt-8">
        <summary
          class="cursor-pointer text-sm text-gray-400 hover:text-white transition-colors w-fit
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light rounded"
        >
          Removed players ({removed.length})
        </summary>
        <div class="flex flex-col gap-2 mt-3">
          {#each removed as p (p.id)}
            <div class="flex items-center justify-between bg-ink-soft/50 border border-white/5 rounded-lg p-3">
              <p class="text-sm text-gray-400">{p.firstName} {p.lastName.trim()}</p>
              <button
                type="button"
                on:click={() => handleRestore(p.id)}
                class="text-sm text-chelsea-blue-light hover:text-white transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light rounded"
              >
                Restore
              </button>
            </div>
          {/each}
        </div>
      </details>
    {/if}
  </div>
</div>
